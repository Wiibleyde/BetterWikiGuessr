import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getHintImage } from "@/lib/game/game";
import { withErrorHandler } from "@/utils/handler";
import {
    OBFUSCATION_PROFILE,
    processHintImage,
    RESPONSE_CACHE_CONTROL,
} from "@/utils/hintImageProcessor";
import { err } from "@/utils/response";

export const dynamic = "force-dynamic";

async function hintImageHandler(request: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const indexParam = searchParams.get("index");

    if (indexParam === null || Number.isNaN(Number(indexParam))) {
        return err("Paramètre index manquant ou invalide", 400);
    }

    const hintIndex = Number.parseInt(indexParam, 10);
    const result = await getHintImage(hintIndex);

    if (!result) {
        return err("Aucune image disponible pour cet index", 404);
    }

    const processed = await processHintImage(
        result.imageUrl,
        result.date,
        hintIndex,
    );
    if (!processed) {
        return err("Impossible de récupérer l'image", 502);
    }

    return new NextResponse(processed.buffer as ArrayBuffer, {
        status: 200,
        headers: {
            "Content-Type": "image/webp",
            "Cache-Control": RESPONSE_CACHE_CONTROL,
            "Content-Length": String(processed.length),
            "X-WikiGuessr-Obfuscation": OBFUSCATION_PROFILE,
        },
    });
}

export const GET = withErrorHandler(hintImageHandler);
