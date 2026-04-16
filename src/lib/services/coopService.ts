import { randomUUID } from "node:crypto";
import {
    checkCoopGuess,
    getAllCoopWordPositions,
    getOrBuildCoopCache,
    verifyCoopWin,
} from "@/lib/game/coop-game";
import { normalizeWord } from "@/lib/game/normalize";
import { fetchRandomWikiPage } from "@/lib/game/wiki";
import {
    addGuess,
    addPlayer,
    createLobby,
    deleteLobby,
    getAllGuessedWords,
    getFoundGuessWords,
    getLobbyByCode,
    getPlayerByToken,
    getPlayerCount,
    removePlayer,
    setLobbyWikiPage,
    transferLeadership,
    updateLobbyStatus,
} from "@/lib/repositories/coopRepository";
import { broadcastToLobby, removeCoopChannel } from "@/lib/supabase/broadcast";
import type { CoopGuessEntry } from "@/types/coop";
import type { WikiSection } from "@/types/wiki";
import { generateLobbyCode } from "@/utils/coop";
import { toDateKey } from "@/utils/date";
import {
    GameAlreadyStartedError,
    GameNotStartedError,
    LobbyFinishedError,
    LobbyFullError,
    LobbyNotFoundError,
    NotLeaderError,
} from "../errors/coopError";

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

export async function leaveLobby(code: string, playerToken: string) {
    const player = await getPlayerByToken(playerToken);
    if (!player) throw new LobbyNotFoundError();

    const lobby = await getLobbyByCode(code);
    if (!lobby) throw new LobbyNotFoundError();

    const wasLeader = player.isLeader;
    const otherPlayers = lobby.players.filter((p) => p.id !== player.id);

    await removePlayer(player.id);

    if (otherPlayers.length === 0) {
        // Last player left — delete the lobby entirely
        await deleteLobby(code);
        removeCoopChannel(code);
        return { deleted: true };
    }

    await broadcastToLobby(code, "player_left", {
        playerId: player.id,
        displayName: player.displayName,
    });

    if (wasLeader) {
        // Transfer leadership to the next oldest player
        const newLeader = otherPlayers[0];
        await transferLeadership(lobby.id, player.id, newLeader.id);
        await broadcastToLobby(code, "leader_changed", {
            newLeaderId: newLeader.id,
            displayName: newLeader.displayName,
        });
    }

    return { deleted: false };
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
            guess: undefined,
            revealedPositions: [],
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

    const guessEntry: CoopGuessEntry = {
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
    };

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
            const revealedPositions = getAllCoopWordPositions(code);
            await broadcastToLobby(code, "game_won", {
                totalGuesses: lobby.guesses.length + 1,
                playerCount,
                positions: revealedPositions,
            });
            removeCoopChannel(code);
            return { guessResult, guess: guessEntry, revealedPositions, won };
        }
    }

    return { guessResult, guess: guessEntry, revealedPositions: [], won };
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
