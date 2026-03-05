import { NextResponse } from "next/server";
import { computeHistoricPages } from "@/lib/historic";

export async function GET(): Promise<NextResponse> {
    try {
        const historicData = await computeHistoricPages();
        return NextResponse.json(historicData);
    } catch (error) {
        console.error("[api/historic]", error);
        return NextResponse.json(
            { error: "Erreur lors du calcul du classement" },
            { status: 500 },
        );
    }
}
