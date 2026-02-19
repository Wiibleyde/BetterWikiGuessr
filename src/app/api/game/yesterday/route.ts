import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function yesterdayUTC(): Date {
    const now = new Date();
    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1),
    );
}

export async function GET(): Promise<NextResponse> {
    try {
        const yesterday = yesterdayUTC();

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
