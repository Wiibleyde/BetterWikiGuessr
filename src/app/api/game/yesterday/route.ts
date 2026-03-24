import { NextResponse } from "next/server";
import { getYesterdaysArticle } from "@/lib/repositories/articleRepository";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
    try {
        const page = await getYesterdaysArticle();

        if (!page) {
            return NextResponse.json({ title: null });
        }

        return NextResponse.json({ title: page.title });
    } catch (error) {
        console.error("[api/game/yesterday]", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
