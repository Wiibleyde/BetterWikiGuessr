import { type NextRequest, NextResponse } from "next/server";
import { checkGuess } from "@/lib/game";

export const dynamic = "force-dynamic";

/**
 * POST /api/game/guess
 * Vérifie un mot deviné contre l'article du jour.
 * Body : { "word": "france" }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const word = body?.word;

        if (!word || typeof word !== "string") {
            return NextResponse.json(
                { error: "Mot manquant" },
                { status: 400 },
            );
        }

        if (word.trim().length === 0 || word.trim().length > 100) {
            return NextResponse.json(
                { error: "Mot invalide" },
                { status: 400 },
            );
        }

        const result = await checkGuess(word);
        return NextResponse.json(result);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Erreur interne";
        console.error("[api/game/guess] Erreur :", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
