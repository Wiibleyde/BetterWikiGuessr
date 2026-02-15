import { type NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ensureDailyWikiPage } from "@/lib/daily-wiki";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json(
                { error: "Non authentifié" },
                { status: 401 },
            );
        }

        const { guessCount } = await request.json();
        if (typeof guessCount !== "number" || guessCount < 1) {
            return NextResponse.json(
                { error: "Nombre d'essais invalide" },
                { status: 400 },
            );
        }

        const dailyPage = await ensureDailyWikiPage();

        // Upsert to ensure idempotency (one result per user per day)
        const result = await prisma.gameResult.upsert({
            where: {
                userId_dailyWikiPageId: {
                    userId: user.id,
                    dailyWikiPageId: dailyPage.id,
                },
            },
            update: {},
            create: {
                userId: user.id,
                dailyWikiPageId: dailyPage.id,
                guessCount,
                won: true,
            },
        });

        return NextResponse.json({ success: true, resultId: result.id });
    } catch (error) {
        console.error("[api/game/complete]", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
