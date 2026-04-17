import type { NextRequest } from "next/server";
import { submitCoopGuessHandler } from "@/lib/controllers/coopController";
import { withErrorHandler, withRateLimit } from "@/utils/handler";

export const dynamic = "force-dynamic";

const submitCoopGuessRoute = async (
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) => {
    const { code } = await params;
    return submitCoopGuessHandler(request, code);
};

export const POST = withErrorHandler(withRateLimit(submitCoopGuessRoute));
