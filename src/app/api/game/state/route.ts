import { type NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";
import { ensureDailyWikiPage } from "@/lib/game/daily-wiki";
import { prisma } from "@/lib/prisma";
import type { GameCache, RevealedMap, StoredGuess } from "@/types/game";

export const dynamic = "force-dynamic";

/**
 * GET /api/game/state — fetch the authenticated user's saved game state for today.
 * Returns { state: GameCache | null }.
 */
export async function GET(): Promise<NextResponse> {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 },
            );
        }

        const dailyPage = await ensureDailyWikiPage();

        const gameState = await prisma.gameState.findUnique({
            where: {
                userId_dailyWikiPageId: {
                    userId: user.id,
                    dailyWikiPageId: dailyPage.id,
                },
            },
        });

        if (!gameState) {
            return NextResponse.json({ state: null });
        }

        const cache: GameCache = {
            guesses: gameState.guesses as unknown as StoredGuess[],
            revealed: gameState.revealed as unknown as RevealedMap,
            saved: gameState.won,
        };

        return NextResponse.json({ state: cache });
    } catch (error) {
        console.error("[api/game/state] GET", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}

/**
 * PUT /api/game/state — save the authenticated user's current game state for today.
 * Body: { guesses: StoredGuess[], revealed: RevealedMap, saved?: boolean }
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 },
            );
        }

        const body = (await request.json()) as GameCache;

        if (!Array.isArray(body.guesses) || typeof body.revealed !== "object") {
            return NextResponse.json(
                { error: "Données invalides" },
                { status: 400 },
            );
        }

        const dailyPage = await ensureDailyWikiPage();

        const guessesJson = JSON.parse(JSON.stringify(body.guesses));
        const revealedJson = JSON.parse(JSON.stringify(body.revealed));

        await prisma.gameState.upsert({
            where: {
                userId_dailyWikiPageId: {
                    userId: user.id,
                    dailyWikiPageId: dailyPage.id,
                },
            },
            update: {
                guesses: guessesJson,
                revealed: revealedJson,
                won: body.saved ?? false,
            },
            create: {
                userId: user.id,
                dailyWikiPageId: dailyPage.id,
                guesses: guessesJson,
                revealed: revealedJson,
                won: body.saved ?? false,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[api/game/state] PUT", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
