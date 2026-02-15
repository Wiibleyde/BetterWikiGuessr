import { NextResponse } from "next/server";
import { getMaskedArticle } from "@/lib/game/game";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
    try {
        const article = await getMaskedArticle();
        return NextResponse.json(article);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Erreur interne";
        console.error("[api/game]", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
