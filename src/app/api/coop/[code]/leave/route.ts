import type { NextRequest } from "next/server";
import { leaveLobbyHandler } from "@/lib/controllers/coopController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

const leaveLobbyRoute = async (
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) => {
    const { code } = await params;
    return leaveLobbyHandler(request, code);
};

export const POST = withErrorHandler(leaveLobbyRoute);
