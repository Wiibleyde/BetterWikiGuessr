import { MIN_GUESSES_FOR_HINT } from "@/constants/game";
import { ensureDailyWikiPage } from "@/lib/game/daily-wiki";
import {
    checkGuess,
    getAllWordPositions,
    getHintImage,
    getMaskedArticle,
    verifyWin,
} from "@/lib/game/game";
import { getCachedYesterdayTitle } from "@/lib/game/yesterday";
import { createOrUpdateGameResult } from "@/lib/repositories/gameResultRepository";
import {
    createOrUpdateGameState,
    getGameStateByUserAndDailyPage,
} from "@/lib/repositories/gameStateRepository";
import type { AuthUser } from "@/types/auth";
import type {
    GameCache,
    HintResult,
    MaskedArticle,
    RevealedMap,
    StoredGuess,
    WordPosition,
} from "@/types/game";
import { buildHintImageUrl } from "@/utils/hintImage";
import { GameVerificationError, HintLockedError, HintNotFoundError } from "../errors/gameError";

export async function getArticle(): Promise<MaskedArticle> {
    return getMaskedArticle();
}

export async function submitGuess(
    word: string,
    revealedWords?: string[],
): Promise<Awaited<ReturnType<typeof checkGuess>>> {
    return checkGuess(word, revealedWords);
}

export async function getGameState(user: AuthUser): Promise<GameCache | null> {
    const dailyPage = await ensureDailyWikiPage();
    const gameState = await getGameStateByUserAndDailyPage(user, dailyPage);

    if (!gameState) return null;

    return {
        guesses: gameState.guesses as unknown as StoredGuess[],
        revealed: gameState.revealed as unknown as RevealedMap,
        saved: gameState.won,
        revealedImages: (gameState.revealedImages as unknown as string[]) ?? [],
    };
}

export async function saveGameState(
    user: AuthUser,
    body: GameCache,
): Promise<void> {
    const dailyPage = await ensureDailyWikiPage();
    const guessesJson = JSON.parse(JSON.stringify(body.guesses));
    const revealedJson = JSON.parse(JSON.stringify(body.revealed));
    const revealedImagesJson = JSON.parse(
        JSON.stringify(body.revealedImages ?? []),
    );
    await createOrUpdateGameState(
        user,
        dailyPage,
        guessesJson,
        revealedJson,
        revealedImagesJson,
        body.saved ?? false,
    );
}

export async function completeGame(
    user: AuthUser,
    guessCount: number,
    guessedWords: string[],
    hintsUsed: number,
): Promise<{ resultId: number }> {
    const won = await verifyWin(guessedWords);
    if (!won) {
        throw new GameVerificationError(
            "Victoire non vérifiée — tous les mots du titre n'ont pas été trouvés",
        );
    }

    const dailyPage = await ensureDailyWikiPage();
    const result = await createOrUpdateGameResult(
        dailyPage,
        user,
        guessCount,
        hintsUsed,
    );
    return { resultId: result.id };
}

export async function revealAll(words: string[]): Promise<WordPosition[]> {
    const won = await verifyWin(words);
    if (!won) {
        throw new GameVerificationError("Victoire non vérifiée");
    }
    return getAllWordPositions();
}

export async function getYesterday(): Promise<string | null> {
    return getCachedYesterdayTitle();
}

export async function getHint(
    hintIndex: number,
    user: AuthUser | null,
    clientGuesses?: string[],
    won?: boolean,
): Promise<HintResult> {
    if (user) {
        const dailyPage = await ensureDailyWikiPage();
        const gameState = await getGameStateByUserAndDailyPage(user, dailyPage);
        const dbGuessCount = Array.isArray(gameState?.guesses)
            ? (gameState.guesses as unknown[]).length
            : 0;
        const hasWon = gameState?.won ?? false;

        if (!hasWon && dbGuessCount < MIN_GUESSES_FOR_HINT) {
            throw new HintLockedError(MIN_GUESSES_FOR_HINT);
        }
    } else {
        const clientGuessCount = Array.isArray(clientGuesses)
            ? clientGuesses.length
            : 0;
        if (!won && clientGuessCount < MIN_GUESSES_FOR_HINT) {
            throw new HintLockedError(MIN_GUESSES_FOR_HINT);
        }
    }

    const result = await getHintImage(hintIndex);
    if (!result) {
        throw new HintNotFoundError(hintIndex);
    }

    return {
        imageUrl: buildHintImageUrl(hintIndex),
        hintIndex: result.hintIndex,
        totalImages: result.totalImages,
    };
}