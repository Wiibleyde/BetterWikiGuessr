import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProfileStats } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
    const user = await getSessionUser();
    if (!user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const results = await prisma.gameResult.findMany({
        where: { userId: user.id },
        include: { dailyWikiPage: { select: { date: true, title: true } } },
        orderBy: { createdAt: "desc" },
    });

    const totalGames = results.length;
    const totalWins = results.filter((r) => r.won).length;
    const winRate = totalGames > 0 ? totalWins / totalGames : 0;
    const averageGuesses =
        totalGames > 0
            ? results.reduce((sum, r) => sum + r.guessCount, 0) / totalGames
            : 0;

    const stats: ProfileStats = {
        totalGames,
        totalWins,
        winRate: Math.round(winRate * 100),
        averageGuesses: Math.round(averageGuesses * 10) / 10,
        results: results.map((r) => ({
            id: r.id,
            guessCount: r.guessCount,
            won: r.won,
            createdAt: r.createdAt.toISOString(),
            date: r.dailyWikiPage.date.toISOString().split("T")[0],
            articleTitle: r.dailyWikiPage.title,
        })),
    };

    return NextResponse.json(stats);
}
