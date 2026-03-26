import type { NextRequest } from "next/server";
import { startGameHandler } from "@/controllers/coopController";
import { err } from "@/utils/response";

export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> },
) {
    try {
        const { code } = await params;
        return startGameHandler(request, code);
    } catch (error) {
        console.error("[/api/coop/[code]/start]", error);
        return err("Erreur interne", 500);
    }
}
