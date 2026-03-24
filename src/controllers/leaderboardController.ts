import type { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/services/leaderboardService";
import type { LeaderboardResponse } from "@/types/leaderboard";
import { ok } from "@/utils/response";

export async function getLeaderboardHandler(
    _request: NextRequest,
): Promise<NextResponse> {
    const categories = await getLeaderboard();
    const response: LeaderboardResponse = { categories };
    return ok(response);
}
