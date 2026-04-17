import type { NextRequest } from "next/server";
import { getLobbyHandler } from "@/lib/controllers/coopController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

const getLobbyRoute = async (
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) => {
    const { code } = await params;
    return getLobbyHandler(request, code);
};

export const GET = withErrorHandler(getLobbyRoute);
