import { type NextRequest, NextResponse } from "next/server";
import { MIN_GUESSES_FOR_HINT } from "@/constants/game";
import { getSessionUser } from "@/lib/auth/auth";
import { ensureDailyWikiPage } from "@/lib/game/daily-wiki";
import { getHintImage } from "@/lib/game/game";
import { getGameStateByUserAndDailyPage } from "@/lib/repositories/gameStateRepository";
import { buildHintImageUrl } from "@/utils/hintImage";

export const dynamic = "force-dynamic";

interface HintRequest {
    hintIndex: number;
    /** Words already guessed — required for unauthenticated players. */
    guesses?: string[];
    /** True when reveal is triggered post-win (all images shown as reward). */
    won?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = (await request.json()) as HintRequest;
        const { hintIndex, guesses: bodyGuesses, won: bodyWon } = body;

        if (typeof hintIndex !== "number" || hintIndex < 0) {
            return NextResponse.json(
                { error: "Index d'indice invalide" },
                { status: 400 },
            );
        }

        // --- Server-side unlock check ---
        const user = await getSessionUser();
        if (user) {
            // Authenticated: verify against DB state (cannot be spoofed)
            const dailyPage = await ensureDailyWikiPage();
            const gameState = await getGameStateByUserAndDailyPage(
                user,
                dailyPage,
            );
            const dbGuessCount = Array.isArray(gameState?.guesses)
                ? (gameState.guesses as unknown[]).length
                : 0;
            const hasWon = gameState?.won ?? false;
            if (!hasWon && dbGuessCount < MIN_GUESSES_FOR_HINT) {
                return NextResponse.json(
                    {
                        error: `Les indices images se débloquent après ${MIN_GUESSES_FOR_HINT} essais`,
                    },
                    { status: 403 },
                );
            }
        } else {
            // Unauthenticated: rely on client-provided guess list
            const clientGuessCount = Array.isArray(bodyGuesses)
                ? bodyGuesses.length
                : 0;
            if (!bodyWon && clientGuessCount < MIN_GUESSES_FOR_HINT) {
                return NextResponse.json(
                    {
                        error: `Les indices images se débloquent après ${MIN_GUESSES_FOR_HINT} essais`,
                    },
                    { status: 403 },
                );
            }
        }

        const result = await getHintImage(hintIndex);
        if (!result) {
            return NextResponse.json(
                { error: "Aucune image disponible pour cet index" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            imageUrl: buildHintImageUrl(hintIndex),
            hintIndex: result.hintIndex,
            totalImages: result.totalImages,
        });
    } catch (error) {
        console.error("[api/game/hint]", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
