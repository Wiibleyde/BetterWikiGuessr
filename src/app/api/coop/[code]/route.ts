import type { NextRequest } from "next/server";
import { getLobbyHandler } from "@/lib/controllers/coopController";
import { err } from "@/utils/response";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) {
    try {
        const { code } = await params;
        return getLobbyHandler(request, code);
    } catch (error) {
        console.error("[/api/coop/[code]]", error);
        return err("Erreur interne", 500);
    }
}
