import { type NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { checkGuess } from "@/lib/game/game";

export const dynamic = "force-dynamic";

interface GuessRequest {
    word: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip") ??
            "unknown";

        const { allowed, retryAfterMs } = checkRateLimit(ip);
        if (!allowed) {
            return NextResponse.json(
                { error: "Trop de requêtes, réessayez dans quelques secondes" },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
                    },
                },
            );
        }

        const body = (await request.json()) as GuessRequest;
        const { word } = body;

        if (!word || typeof word !== "string") {
            return NextResponse.json(
                { error: "Mot manquant" },
                { status: 400 },
            );
        }

        const trimmed = word.trim();
        if (trimmed.length === 0 || trimmed.length > 100) {
            return NextResponse.json(
                { error: "Mot invalide" },
                { status: 400 },
            );
        }

        const result = await checkGuess(trimmed);
        return NextResponse.json(result);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Erreur interne";
        console.error("[api/game/guess]", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
