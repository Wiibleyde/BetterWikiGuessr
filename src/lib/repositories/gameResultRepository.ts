import type { AuthUser } from "@/types/auth";
import type {
    BestScoreRow,
    GameResultWithDailyPage,
    MostWinsRow,
    VictoryRow,
} from "@/types/repository";
import type { DailyWikiPage, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export const getVictoriesGroupedByUser = async (): Promise<VictoryRow[]> => {
    const results = await prisma.gameResult.findMany({
        where: { won: true },
        select: {
            userId: true,
            user: { select: { name: true, image: true } },
            dailyWikiPage: { select: { date: true } },
        },
        orderBy: { dailyWikiPage: { date: "asc" } },
    });
    return results;
};

export const getBestScoreByUser = async (): Promise<BestScoreRow[]> => {
    const results = await prisma.gameResult.findMany({
        where: { won: true },
        select: {
            userId: true,
            guessCount: true,
            hintsUsed: true,
            user: { select: { name: true, image: true } },
            dailyWikiPage: { select: { title: true, date: true } },
        },
        orderBy: { guessCount: "asc" },
    });
    return results;
};

export const getMostWins = async (): Promise<MostWinsRow[]> => {
    const results = await prisma.gameResult.groupBy({
        by: ["userId"],
        where: { won: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 20,
    });
    return results;
};

export const createOrUpdateGameResult = async (
    dailyPage: DailyWikiPage,
    user: AuthUser,
    guessCount: number,
    safeHintsUsed: number,
): Promise<Prisma.GameResultGetPayload<object>> => {
    const result = await prisma.gameResult.upsert({
        where: {
            userId_dailyWikiPageId: {
                userId: user.id,
                dailyWikiPageId: dailyPage.id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            dailyWikiPageId: dailyPage.id,
            guessCount,
            hintsUsed: safeHintsUsed,
            won: true,
        },
    });
    return result;
};

export const getGameResultsByUserId = async (
    userId: string,
): Promise<GameResultWithDailyPage[]> => {
    const results = await prisma.gameResult.findMany({
        where: { userId },
        include: { dailyWikiPage: { select: { date: true, title: true } } },
        orderBy: { createdAt: "desc" },
    });
    return results;
};
