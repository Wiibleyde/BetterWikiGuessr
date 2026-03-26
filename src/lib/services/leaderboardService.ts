import { computeLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardCategoryData } from "@/types/leaderboard";

export async function getLeaderboard(): Promise<LeaderboardCategoryData[]> {
    return computeLeaderboard();
}
