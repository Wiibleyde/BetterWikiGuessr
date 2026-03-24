import type { NextRequest, NextResponse } from "next/server";
import { getUserStats } from "@/services/profileService";
import type { AuthUser } from "@/types/auth";
import { ok } from "@/utils/response";

export async function getStatsHandler(
    _request: NextRequest,
    user: AuthUser,
): Promise<NextResponse> {
    const stats = await getUserStats(user.id);
    return ok(stats);
}
