import type { AuthUser } from "@/types/auth";
import type { DailyWikiPage, Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export const getGameStateByUserAndDailyPage = async (
    user: AuthUser,
    dailyPage: DailyWikiPage,
) => {
    const gameState = await prisma.gameState.findUnique({
        where: {
            userId_dailyWikiPageId: {
                userId: user.id,
                dailyWikiPageId: dailyPage.id,
            },
        },
    });
    return gameState;
};

export const createOrUpdateGameState = async (
    user: AuthUser,
    dailyPage: DailyWikiPage,
    guessesJson: Prisma.InputJsonValue,
    revealedJson: Prisma.InputJsonValue,
    revealedImagesJson: Prisma.InputJsonValue,
    won: boolean,
) => {
    const gameState = await prisma.gameState.upsert({
        where: {
            userId_dailyWikiPageId: {
                userId: user.id,
                dailyWikiPageId: dailyPage.id,
            },
        },
        update: {
            guesses: guessesJson,
            revealed: revealedJson,
            won: won,
            revealedImages: revealedImagesJson,
        },
        create: {
            userId: user.id,
            dailyWikiPageId: dailyPage.id,
            guesses: guessesJson,
            revealed: revealedJson,
            won: won,
            revealedImages: revealedImagesJson,
        },
    });
    return gameState;
};
