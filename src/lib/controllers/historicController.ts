import type { NextRequest, NextResponse } from "next/server";
import { getHistoric } from "@/lib/services/historicService";
import { ok } from "@/utils/response";

export async function getHistoricHandler(
    _request: NextRequest,
): Promise<NextResponse> {
    const data = await getHistoric();
    return ok(data);
}
