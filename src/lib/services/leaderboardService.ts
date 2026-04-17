import { computeLeaderboard } from "@/lib/services/leaderboard/computeLeaderboard";
import type { LeaderboardCategoryData } from "@/types/leaderboard";

export async function getLeaderboard(): Promise<LeaderboardCategoryData[]> {
    return computeLeaderboard();
}
