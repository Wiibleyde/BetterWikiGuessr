import { randomUUID } from "node:crypto";
import {
    checkCoopGuess,
    getOrBuildCoopCache,
    verifyCoopWin,
} from "@/lib/game/coop-game";
import { normalizeWord } from "@/lib/game/normalize";
import { fetchRandomWikiPage } from "@/lib/game/wiki";
import {
    addGuess,
    addPlayer,
    createLobby,
    getAllGuessedWords,
    getFoundGuessWords,
    getLobbyByCode,
    getPlayerByToken,
    getPlayerCount,
    setLobbyWikiPage,
    updateLobbyStatus,
} from "@/lib/repositories/coopRepository";
import { broadcastToLobby, removeCoopChannel } from "@/lib/supabase/broadcast";
import type { WikiSection } from "@/types/wiki";

function generateLobbyCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function toDateKey(date: Date): string {
    return date.toISOString().split("T")[0];
}

export async function createCoopLobby(displayName: string, userId?: string) {
    const code = generateLobbyCode();
    const playerToken = randomUUID();
    const lobby = await createLobby(code, displayName, playerToken, userId);
    const player = lobby.players[0];

    return { lobby, player, playerToken };
}

export async function joinCoopLobby(
    code: string,
    displayName: string,
    userId?: string,
) {
    const lobby = await getLobbyByCode(code);
    if (!lobby) throw new LobbyNotFoundError();
    if (lobby.status === "finished") throw new LobbyFinishedError();

    // If authenticated user already in lobby, return existing player
    if (userId) {
        const existing = lobby.players.find((p) => p.userId === userId);
        if (existing) {
            return { lobby, player: existing, playerToken: existing.token };
        }
    }

    // Allow non-authenticated players to rejoin by display name
    if (!userId) {
        const existing = lobby.players.find(
            (p) =>
                !p.userId &&
                p.displayName.toLowerCase() === displayName.toLowerCase(),
        );
        if (existing) {
            return { lobby, player: existing, playerToken: existing.token };
        }
    }

    const playerCount = lobby.players.length;
    if (playerCount >= lobby.maxPlayers) throw new LobbyFullError();

    const playerToken = randomUUID();
    const player = await addPlayer(lobby.id, displayName, playerToken, userId);

    await broadcastToLobby(code, "player_joined", {
        playerId: player.id,
        displayName: player.displayName,
    });

    return { lobby, player, playerToken };
}

export async function startCoopGame(code: string, playerToken: string) {
    const player = await getPlayerByToken(playerToken);
    if (!player) throw new LobbyNotFoundError();
    if (!player.isLeader) throw new NotLeaderError();

    const lobby = await getLobbyByCode(code);
    if (!lobby) throw new LobbyNotFoundError();
    if (lobby.status !== "waiting") throw new GameAlreadyStartedError();

    const wikiPage = await fetchRandomWikiPage(1500);
    const dateKey = toDateKey(new Date());

    await setLobbyWikiPage(
        code,
        wikiPage.title,
        JSON.parse(JSON.stringify(wikiPage.sections)),
        wikiPage.images,
        wikiPage.url,
    );

    const cache = getOrBuildCoopCache(
        code,
        wikiPage.title,
        wikiPage.sections,
        dateKey,
    );

    await broadcastToLobby(code, "game_started", {
        article: cache.maskedArticle,
    });

    return cache.maskedArticle;
}

export async function submitCoopGuess(
    code: string,
    playerToken: string,
    word: string,
) {
    const player = await getPlayerByToken(playerToken);
    if (!player) throw new LobbyNotFoundError();

    const lobby = await getLobbyByCode(code);
    if (!lobby) throw new LobbyNotFoundError();
    if (lobby.status !== "playing") throw new GameNotStartedError();

    // Ensure cache exists
    if (lobby.wikiTitle && lobby.wikiSections) {
        const dateKey = toDateKey(lobby.createdAt);
        getOrBuildCoopCache(
            code,
            lobby.wikiTitle,
            lobby.wikiSections as unknown as WikiSection[],
            dateKey,
        );
    }

    const allGuessedWords = await getAllGuessedWords(lobby.id);
    const normalizedWord = normalizeWord(word.trim());
    if (normalizedWord && allGuessedWords.includes(normalizedWord)) {
        return {
            guessResult: {
                found: false,
                word: normalizedWord,
                positions: [],
                occurrences: 0,
                similarity: 0,
            },
            won: false,
        };
    }

    const revealedWords = await getFoundGuessWords(lobby.id);
    const guessResult = checkCoopGuess(code, word, revealedWords);
    if (!guessResult) throw new GameNotStartedError();

    const guess = await addGuess(
        lobby.id,
        player.id,
        guessResult.word,
        guessResult.found,
        guessResult.occurrences,
        guessResult.similarity,
        JSON.parse(JSON.stringify(guessResult.positions)),
    );

    await broadcastToLobby(code, "guess_result", {
        guess: {
            id: guess.id,
            word: guessResult.word,
            found: guessResult.found,
            occurrences: guessResult.occurrences,
            similarity: guessResult.similarity,
            positions: guessResult.positions,
            proximityReason: guessResult.proximityReason,
            createdAt: guess.createdAt.toISOString(),
            player: {
                id: player.id,
                displayName: player.displayName,
            },
        },
    });

    // Check win
    const allFoundWords = guessResult.found
        ? [...revealedWords, guessResult.word]
        : revealedWords;
    const won = verifyCoopWin(code, allFoundWords);

    if (won) {
        // Re-fetch status to guard against a concurrent winner
        const freshLobby = await getLobbyByCode(code);
        if (freshLobby && freshLobby.status === "playing") {
            await updateLobbyStatus(code, "finished");
            const playerCount = await getPlayerCount(lobby.id);
            await broadcastToLobby(code, "game_won", {
                totalGuesses: lobby.guesses.length + 1,
                playerCount,
            });
            removeCoopChannel(code);
        }
    }

    return { guessResult, won };
}

export async function getCoopLobbyState(code: string) {
    const lobby = await getLobbyByCode(code);
    if (!lobby) throw new LobbyNotFoundError();

    let article = null;
    if (lobby.wikiTitle && lobby.wikiSections && lobby.status !== "waiting") {
        const dateKey = toDateKey(lobby.createdAt);
        const cache = getOrBuildCoopCache(
            code,
            lobby.wikiTitle,
            lobby.wikiSections as unknown as WikiSection[],
            dateKey,
        );
        article = cache.maskedArticle;
    }

    const guessCountByPlayer = new Map<number, number>();
    for (const g of lobby.guesses) {
        guessCountByPlayer.set(
            g.playerId,
            (guessCountByPlayer.get(g.playerId) ?? 0) + 1,
        );
    }

    return {
        lobby: {
            code: lobby.code,
            status: lobby.status,
            maxPlayers: lobby.maxPlayers,
            createdAt: lobby.createdAt.toISOString(),
        },
        players: lobby.players.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            isLeader: p.isLeader,
            guessCount: guessCountByPlayer.get(p.id) ?? 0,
        })),
        guesses: lobby.guesses.map((g) => ({
            id: g.id,
            word: g.word,
            found: g.found,
            occurrences: g.occurrences,
            similarity: g.similarity,
            positions: g.positions,
            player: g.player,
            createdAt: g.createdAt.toISOString(),
        })),
        article,
    };
}

// ─── Domain errors ────────────────────────────────────────────────────────────

export class LobbyNotFoundError extends Error {
    constructor() {
        super("Lobby introuvable");
        this.name = "LobbyNotFoundError";
    }
}

export class LobbyFullError extends Error {
    constructor() {
        super("Le lobby est plein");
        this.name = "LobbyFullError";
    }
}

export class LobbyFinishedError extends Error {
    constructor() {
        super("La partie est terminée");
        this.name = "LobbyFinishedError";
    }
}

export class NotLeaderError extends Error {
    constructor() {
        super("Seul le leader peut démarrer la partie");
        this.name = "NotLeaderError";
    }
}

export class GameAlreadyStartedError extends Error {
    constructor() {
        super("La partie a déjà commencé");
        this.name = "GameAlreadyStartedError";
    }
}

export class GameNotStartedError extends Error {
    constructor() {
        super("La partie n'a pas encore commencé");
        this.name = "GameNotStartedError";
    }
}
