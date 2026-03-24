import { type NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/auth";
import { ensureDailyWikiPage } from "@/lib/game/daily-wiki";
import { verifyWin } from "@/lib/game/game";
import { createOrUpdateGameResult } from "@/lib/repositories/gameResultRepository";

export const dynamic = "force-dynamic";

const MAX_GUESS_COUNT = 10_000;

interface CompleteRequest {
    guessCount: number;
    guessedWords: string[];
    hintsUsed: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 },
            );
        }

        const body = (await request.json()) as CompleteRequest;
        const { guessCount, guessedWords, hintsUsed } = body;

        if (
            typeof guessCount !== "number" ||
            guessCount < 1 ||
            guessCount > MAX_GUESS_COUNT
        ) {
            return NextResponse.json(
                { error: "Nombre d'essais invalide" },
                { status: 400 },
            );
        }

        if (!Array.isArray(guessedWords) || guessedWords.length === 0) {
            return NextResponse.json(
                { error: "Liste de mots manquante" },
                { status: 400 },
            );
        }

        const safeHintsUsed =
            typeof hintsUsed === "number" && hintsUsed >= 0
                ? Math.floor(hintsUsed)
                : 0;

        const won = await verifyWin(guessedWords);
        if (!won) {
            return NextResponse.json(
                {
                    error: "Victoire non vérifiée — tous les mots du titre n'ont pas été trouvés",
                },
                { status: 400 },
            );
        }

        const dailyPage = await ensureDailyWikiPage();

        const result = await createOrUpdateGameResult(
            dailyPage,
            user,
            guessCount,
            safeHintsUsed,
        );

        return NextResponse.json({ success: true, resultId: result.id });
    } catch (error) {
        console.error("[api/game/complete]", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
