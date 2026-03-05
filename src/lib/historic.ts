import type { PageEntry } from "@/types/historic";
import { prisma } from "./prisma";

export async function computeHistoricPages(): Promise<PageEntry[]> {
    const today = new Date();

    const results = await prisma.dailyWikiPage.findMany({
        where: { date: { lt: today } },
        orderBy: { date: "desc" },
        select: {
            id: true,
            date: true,
            title: true,
            url: true,
        },
    });

    return results;
}
