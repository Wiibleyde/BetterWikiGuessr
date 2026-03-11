import type { WikiPage } from "@/types/wiki";
import { todayInGameTZ, yesterdayInGameTZ } from "../game/date";
import { prisma } from "../prisma";

export const createArticle = async (wikiPage: WikiPage) => {
    const today = todayInGameTZ();
    const created = await prisma.dailyWikiPage.create({
        data: {
            title: wikiPage.title,
            sections: JSON.parse(JSON.stringify(wikiPage.sections)),
            images: wikiPage.images,
            date: today,
            url: wikiPage.url,
        },
    });
    return created;
};

export const getTodaysArticle = async () => {
    const today = todayInGameTZ();
    return prisma.dailyWikiPage.findUnique({
        where: { date: today },
    });
}

export const getYesterdaysArticle = async () => {
    const yesterday = yesterdayInGameTZ();
    return prisma.dailyWikiPage.findUnique({
        where: { date: yesterday },
    });
}

export const getArticleLtDate = async (date: Date) => {
    return prisma.dailyWikiPage.findMany({
        where: { date: { lt: date } },
        orderBy: { date: "desc" }
    });
}