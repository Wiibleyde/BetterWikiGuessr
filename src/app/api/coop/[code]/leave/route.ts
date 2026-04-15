import type { NextRequest } from "next/server";
import { leaveLobbyHandler } from "@/lib/controllers/coopController";
import { err } from "@/utils/response";

export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) {
    try {
        const { code } = await params;
        return leaveLobbyHandler(request, code);
    } catch (error) {
        console.error("[/api/coop/[code]/leave]", error);
        return err("Erreur interne", 500);
    }
}
