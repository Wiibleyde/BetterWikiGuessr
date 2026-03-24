import { getGameResultsByUserId } from "@/lib/repositories/gameResultRepository";
import type { ProfileStats } from "@/types/auth";

export async function getUserStats(userId: string): Promise<ProfileStats> {
    const results = await getGameResultsByUserId(userId);

    const totalGames = results.length;
    const totalWins = results.filter((r) => r.won).length;
    const winRate = totalGames > 0 ? totalWins / totalGames : 0;
    const averageGuesses =
        totalGames > 0
            ? results.reduce((sum, r) => sum + r.guessCount, 0) / totalGames
            : 0;
    const averageHints =
        totalGames > 0
            ? results.reduce((sum, r) => sum + r.hintsUsed, 0) / totalGames
            : 0;

    return {
        totalGames,
        totalWins,
        winRate: Math.round(winRate * 100),
        averageGuesses: Math.round(averageGuesses * 10) / 10,
        averageHints: Math.round(averageHints * 10) / 10,
        results: results.map((r) => ({
            id: r.id,
            guessCount: r.guessCount,
            hintsUsed: r.hintsUsed,
            won: r.won,
            createdAt: r.createdAt.toISOString(),
            date: r.dailyWikiPage.date.toISOString().split("T")[0],
            articleTitle: r.dailyWikiPage.title,
        })),
    };
}
