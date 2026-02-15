import { NextResponse } from "next/server";
import { computeLeaderboard } from "@/lib/leaderboard";
import type { LeaderboardResponse } from "@/types/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
    try {
        const categories = await computeLeaderboard();
        const response: LeaderboardResponse = { categories };
        return NextResponse.json(response);
    } catch (err) {
        console.error("[api/leaderboard]", err);
        return NextResponse.json(
            { error: "Erreur lors du calcul du classement" },
            { status: 500 },
        );
    }
}
