import { NextResponse } from "next/server";
import { ensureDailyWikiPage } from "@/lib/daily-wiki";

export const dynamic = "force-dynamic";

/**
 * GET /api/daily-wiki
 * Retourne la page wiki du jour (la crée si elle n'existe pas encore).
 */
export async function GET(): Promise<NextResponse> {
    try {
        const page = await ensureDailyWikiPage();
        return NextResponse.json({
            id: page.id,
            title: page.title,
            sections: page.sections,
            images: page.images,
            date: page.date,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Erreur interne";
        console.error("[api/daily-wiki] Erreur :", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
