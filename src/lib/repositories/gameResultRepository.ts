import type { AuthUser } from "@/types/auth";
import type { DailyWikiPage } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export const getVictoriesGroupedByUser = async () => {
    const results = await prisma.gameResult.findMany({
        where: { won: true },
        select: {
            userId: true,
            user: { select: { username: true, avatar: true, discordId: true } },
            dailyWikiPage: { select: { date: true } },
        },
        orderBy: { dailyWikiPage: { date: "asc" } },
    });
    return results;
};

export const getBestScoreByUser = async () => {
    const results = await prisma.gameResult.findMany({
        where: { won: true },
        select: {
            userId: true,
            guessCount: true,
            hintsUsed: true,
            user: { select: { username: true, avatar: true, discordId: true } },
            dailyWikiPage: { select: { title: true, date: true } },
        },
        orderBy: { guessCount: "asc" },
    });
    return results;
};

export const getMostWins = async () => {
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
) => {
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

export const getGameResultsByUserId = async (userId: number) => {
    const results = await prisma.gameResult.findMany({
        where: { userId },
        include: { dailyWikiPage: { select: { date: true, title: true } } },
        orderBy: { createdAt: "desc" },
    });
    return results;
}