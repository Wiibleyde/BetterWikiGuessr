import type { NextRequest, NextResponse } from "next/server";
import {
    createCoopLobby,
    GameAlreadyStartedError,
    GameNotStartedError,
    getCoopLobbyState,
    joinCoopLobby,
    LobbyFinishedError,
    LobbyFullError,
    LobbyNotFoundError,
    NotLeaderError,
    startCoopGame,
    submitCoopGuess,
} from "@/lib/services/coopService";
import { err, ok } from "@/utils/response";

export async function createLobbyHandler(
    request: NextRequest,
): Promise<NextResponse> {
    const body = (await request.json()) as {
        displayName?: unknown;
        userId?: unknown;
    };

    if (!body.displayName || typeof body.displayName !== "string") {
        return err("Nom d'affichage requis", 400);
    }

    const trimmed = body.displayName.trim();
    if (trimmed.length === 0 || trimmed.length > 30) {
        return err("Nom invalide (1-30 caractères)", 400);
    }

    const userId = typeof body.userId === "string" ? body.userId : undefined;

    const { lobby, player, playerToken } = await createCoopLobby(
        trimmed,
        userId,
    );

    return ok({
        code: lobby.code,
        playerId: player.id,
        playerToken,
        isLeader: true,
    });
}

export async function joinLobbyHandler(
    request: NextRequest,
): Promise<NextResponse> {
    const body = (await request.json()) as {
        code?: unknown;
        displayName?: unknown;
        userId?: unknown;
    };

    if (!body.code || typeof body.code !== "string") {
        return err("Code du lobby requis", 400);
    }
    if (!body.displayName || typeof body.displayName !== "string") {
        return err("Nom d'affichage requis", 400);
    }

    const code = body.code.trim().toUpperCase();
    const trimmed = body.displayName.trim();

    if (trimmed.length === 0 || trimmed.length > 30) {
        return err("Nom invalide (1-30 caractères)", 400);
    }

    const userId = typeof body.userId === "string" ? body.userId : undefined;

    try {
        const { lobby, player, playerToken } = await joinCoopLobby(
            code,
            trimmed,
            userId,
        );

        return ok({
            code: lobby.code,
            playerId: player.id,
            playerToken,
            isLeader: player.isLeader,
        });
    } catch (error) {
        if (error instanceof LobbyNotFoundError) return err(error.message, 404);
        if (error instanceof LobbyFullError) return err(error.message, 400);
        if (error instanceof LobbyFinishedError) return err(error.message, 400);
        throw error;
    }
}

export async function getLobbyHandler(
    _request: NextRequest,
    code: string,
): Promise<NextResponse> {
    try {
        const state = await getCoopLobbyState(code);
        return ok(state);
    } catch (error) {
        if (error instanceof LobbyNotFoundError) return err(error.message, 404);
        throw error;
    }
}

export async function startGameHandler(
    request: NextRequest,
    code: string,
): Promise<NextResponse> {
    const body = (await request.json()) as { playerToken?: unknown };

    if (!body.playerToken || typeof body.playerToken !== "string") {
        return err("Token joueur requis", 400);
    }

    try {
        const article = await startCoopGame(code, body.playerToken);
        return ok({ article });
    } catch (error) {
        if (error instanceof LobbyNotFoundError) return err(error.message, 404);
        if (error instanceof NotLeaderError) return err(error.message, 403);
        if (error instanceof GameAlreadyStartedError)
            return err(error.message, 400);
        throw error;
    }
}

export async function submitCoopGuessHandler(
    request: NextRequest,
    code: string,
): Promise<NextResponse> {
    const body = (await request.json()) as {
        playerToken?: unknown;
        word?: unknown;
    };

    if (!body.playerToken || typeof body.playerToken !== "string") {
        return err("Token joueur requis", 400);
    }
    if (!body.word || typeof body.word !== "string") {
        return err("Mot manquant", 400);
    }

    const trimmed = (body.word as string).trim();
    if (trimmed.length === 0 || trimmed.length > 100) {
        return err("Mot invalide", 400);
    }

    try {
        const { guessResult, won } = await submitCoopGuess(
            code,
            body.playerToken,
            trimmed,
        );
        return ok({ ...guessResult, won });
    } catch (error) {
        if (error instanceof LobbyNotFoundError) return err(error.message, 404);
        if (error instanceof GameNotStartedError)
            return err(error.message, 400);
        throw error;
    }
}
