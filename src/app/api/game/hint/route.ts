import { type NextRequest, NextResponse } from "next/server";
import { getHintImage } from "@/lib/game/game";

export const dynamic = "force-dynamic";

interface HintRequest {
    hintIndex: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = (await request.json()) as HintRequest;
        const { hintIndex } = body;

        if (typeof hintIndex !== "number" || hintIndex < 0) {
            return NextResponse.json(
                { error: "Index d'indice invalide" },
                { status: 400 },
            );
        }

        const result = await getHintImage(hintIndex);
        if (!result) {
            return NextResponse.json(
                { error: "Aucune image disponible pour cet index" },
                { status: 404 },
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[api/game/hint]", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
