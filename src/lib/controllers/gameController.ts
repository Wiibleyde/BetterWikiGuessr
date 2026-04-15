import type { NextRequest, NextResponse } from "next/server";
import {
    GameVerificationError,
    HintLockedError,
    HintNotFoundError,
} from "@/lib/errors/gameError";
import {
    completeGame,
    getArticle,
    getGameState,
    getHint,
    getYesterday,
    revealAll,
    saveGameState,
    submitGuess,
} from "@/lib/services/gameService";
import type { AuthUser } from "@/types/auth";
import type { GameCache } from "@/types/game";
import { err, ok } from "@/utils/response";

const MAX_GUESS_COUNT = 10_000;

export async function getArticleHandler(
    _request: NextRequest,
): Promise<NextResponse> {
    const article = await getArticle();
    return ok(article, 200, {
        "Cache-Control": "no-store, no-cache, must-revalidate",
    });
}

export async function submitGuessHandler(
    request: NextRequest,
): Promise<NextResponse> {
    const body = (await request.json()) as {
        word?: unknown;
        revealedWords?: unknown;
    };
    const { word } = body;

    if (!word || typeof word !== "string") {
        return err("Mot manquant", 400);
    }
    const trimmed = word.trim();
    if (trimmed.length === 0 || trimmed.length > 100) {
        return err("Mot invalide", 400);
    }

    const revealedWords = Array.isArray(body.revealedWords)
        ? body.revealedWords.filter((w): w is string => typeof w === "string")
        : undefined;

    const result = await submitGuess(trimmed, revealedWords);
    return ok(result);
}

export async function getStateHandler(
    _request: NextRequest,
    user: AuthUser,
): Promise<NextResponse> {
    const state = await getGameState(user);
    return ok({ state });
}

export async function saveStateHandler(
    request: NextRequest,
    user: AuthUser,
): Promise<NextResponse> {
    const body = (await request.json()) as GameCache;

    if (!Array.isArray(body.guesses) || typeof body.revealed !== "object") {
        return err("Données invalides", 400);
    }

    await saveGameState(user, body);
    return ok({ success: true });
}

export async function completeGameHandler(
    request: NextRequest,
    user: AuthUser,
): Promise<NextResponse> {
    const body = (await request.json()) as {
        guessCount?: unknown;
        guessedWords?: unknown;
        hintsUsed?: unknown;
    };
    const { guessCount, guessedWords, hintsUsed } = body;

    if (
        typeof guessCount !== "number" ||
        guessCount < 1 ||
        guessCount > MAX_GUESS_COUNT
    ) {
        return err("Nombre d'essais invalide", 400);
    }

    if (!Array.isArray(guessedWords) || guessedWords.length === 0) {
        return err("Liste de mots manquante", 400);
    }

    const safeHintsUsed =
        typeof hintsUsed === "number" && hintsUsed >= 0
            ? Math.floor(hintsUsed)
            : 0;

    try {
        const result = await completeGame(
            user,
            guessCount,
            guessedWords as string[],
            safeHintsUsed,
        );
        return ok({ success: true, resultId: result.resultId });
    } catch (error) {
        if (error instanceof GameVerificationError) {
            return err(error.message, 400);
        }
        throw error;
    }
}

export async function revealAllHandler(
    request: NextRequest,
): Promise<NextResponse> {
    const body = (await request.json()) as { words?: unknown };
    const { words } = body;

    if (!Array.isArray(words) || words.length === 0) {
        return err("Liste de mots requise", 400);
    }

    try {
        const positions = await revealAll(words as string[]);
        return ok({ positions });
    } catch (error) {
        if (error instanceof GameVerificationError) {
            return err(error.message, 403);
        }
        throw error;
    }
}

export async function getYesterdayHandler(
    _request: NextRequest,
): Promise<NextResponse> {
    const title = await getYesterday();
    return ok({ title });
}

export async function getHintHandler(
    request: NextRequest,
    user: AuthUser | null,
): Promise<NextResponse> {
    const body = (await request.json()) as {
        hintIndex?: unknown;
        guesses?: unknown;
        won?: unknown;
    };
    const { hintIndex, guesses, won } = body;

    if (typeof hintIndex !== "number" || hintIndex < 0) {
        return err("Index d'indice invalide", 400);
    }

    const clientGuesses = Array.isArray(guesses)
        ? guesses.filter((g): g is string => typeof g === "string")
        : undefined;

    try {
        const result = await getHint(
            hintIndex,
            user,
            clientGuesses,
            won === true,
        );
        return ok(result);
    } catch (error) {
        if (error instanceof HintLockedError) return err(error.message, 403);
        if (error instanceof HintNotFoundError) return err(error.message, 404);
        throw error;
    }
}
