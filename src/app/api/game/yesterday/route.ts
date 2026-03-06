import { NextResponse } from "next/server";
import { yesterdayInGameTZ } from "@/lib/game/date";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
    try {
        const yesterday = yesterdayInGameTZ();

        const page = await prisma.dailyWikiPage.findUnique({
            where: { date: yesterday },
            select: { title: true },
        });

        if (!page) {
            return NextResponse.json({ title: null });
        }

        return NextResponse.json({ title: page.title });
    } catch (error) {
        console.error("[api/game/yesterday]", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
