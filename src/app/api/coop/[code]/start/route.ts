import type { NextRequest } from "next/server";
import { startGameHandler } from "@/lib/controllers/coopController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

const startGameRoute = async (
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) => {
    const { code } = await params;
    return startGameHandler(request, code);
};

export const POST = withErrorHandler(startGameRoute);
