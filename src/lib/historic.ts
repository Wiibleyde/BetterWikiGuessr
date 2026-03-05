import type { PageEntry } from "@/types/historic";
import { prisma } from "./prisma";

export async function computeHistoricPages(): Promise<PageEntry[]> {
    const results = await prisma.dailyWikiPage.findMany({
        orderBy: { date: "asc" },
        select: {
            id: true,
            date: true,
            title: true,
            url: true,
        },
    });

    return results;
}
