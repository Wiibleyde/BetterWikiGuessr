import { NextResponse } from "next/server";
import { getMaskedArticle } from "@/lib/game";

export const dynamic = "force-dynamic";

/**
 * GET /api/game
 * Retourne la structure masquée de l'article du jour.
 * Aucun texte de contenu n'est envoyé — anti-triche.
 */
export async function GET(): Promise<NextResponse> {
    try {
        const article = await getMaskedArticle();
        return NextResponse.json(article);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Erreur interne";
        console.error("[api/game] Erreur :", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
