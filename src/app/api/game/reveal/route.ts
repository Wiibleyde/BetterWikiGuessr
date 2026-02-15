import { NextResponse } from "next/server";
import { getAllWordPositions, verifyWin } from "@/lib/game/game";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const body = (await req.json()) as { words?: string[] };
        const words = body.words;

        if (!Array.isArray(words) || words.length === 0) {
            return NextResponse.json(
                { error: "Liste de mots requise" },
                { status: 400 },
            );
        }

        const isWin = await verifyWin(words);
        if (!isWin) {
            return NextResponse.json(
                { error: "Victoire non vérifiée" },
                { status: 403 },
            );
        }

        const positions = await getAllWordPositions();
        return NextResponse.json({ positions });
    } catch (error) {
        console.error("[api/game/reveal]", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
