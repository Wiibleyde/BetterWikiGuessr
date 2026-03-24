import type { NextRequest, NextResponse } from "next/server";
import { getHintHandler } from "@/controllers/gameController";
import { auth } from "@/lib/auth/auth";
import type { AuthUser } from "@/types/auth";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

async function hintHandler(request: NextRequest): Promise<NextResponse> {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = (session?.user as AuthUser | undefined) ?? null;
    return getHintHandler(request, user);
}

export const POST = withErrorHandler(hintHandler);
