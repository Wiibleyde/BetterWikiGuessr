import type { NextRequest, NextResponse } from "next/server";
import { getHintHandler } from "@/lib/controllers/gameController";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/types/auth";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

async function hintHandler(request: NextRequest): Promise<NextResponse> {
    const supabase = await createServerClient();
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();

    let user: AuthUser | null = null;
    if (authUser) {
        user =
            ((await prisma.user.findUnique({
                where: { id: authUser.id },
            })) as AuthUser | null) ?? null;
    }
    return getHintHandler(request, user);
}

export const POST = withErrorHandler(hintHandler);
