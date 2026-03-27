import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { submitCoopGuessHandler } from "@/controllers/coopController";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { err } from "@/utils/response";

export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) {
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

        const { code } = await params;
        return submitCoopGuessHandler(request, code);
    } catch (error) {
        console.error("[/api/coop/[code]/guess]", error);
        return err("Erreur interne", 500);
    }
}
