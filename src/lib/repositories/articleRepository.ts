import type { HistoricDailyWikiPage } from "@/types/repository";
import type { WikiPage } from "@/types/wiki";
import type { DailyWikiPage } from "../../../generated/prisma/client";
import { todayInGameTZ, yesterdayInGameTZ } from "../game/date";
import { prisma } from "../prisma";

export const createArticle = async (
    wikiPage: WikiPage,
): Promise<DailyWikiPage> => {
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

export const upsertTodaysArticle = async (
    wikiPage: WikiPage,
): Promise<DailyWikiPage> => {
    const today = todayInGameTZ();
    return prisma.dailyWikiPage.upsert({
        where: { date: today },
        update: {},
        create: {
            title: wikiPage.title,
            sections: JSON.parse(JSON.stringify(wikiPage.sections)),
            images: wikiPage.images,
            date: today,
            url: wikiPage.url,
        },
    });
};

export const getTodaysArticle = async (): Promise<DailyWikiPage | null> => {
    const today = todayInGameTZ();
    return prisma.dailyWikiPage.findUnique({
        where: { date: today },
    });
};

export const getYesterdaysArticle = async (): Promise<DailyWikiPage | null> => {
    const yesterday = yesterdayInGameTZ();
    return prisma.dailyWikiPage.findUnique({
        where: { date: yesterday },
    });
};

export const getArticleLtDate = async (
    date: Date,
): Promise<HistoricDailyWikiPage[]> => {
    return prisma.dailyWikiPage.findMany({
        where: { date: { lt: date } },
        orderBy: { date: "desc" },
        include: {
            _count: {
                select: { gameResults: { where: { won: true } } },
            },
        },
    });
};
