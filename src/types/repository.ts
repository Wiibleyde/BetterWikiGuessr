import type { DailyWikiPage, Prisma } from "../../generated/prisma/client";

export type HistoricDailyWikiPage = DailyWikiPage & {
    _count: {
        gameResults: number;
    };
};

export type CoopLobbyWithPlayers = Prisma.CoopLobbyGetPayload<{
    include: { players: true };
}>;

export type CoopLobbyWithState = Prisma.CoopLobbyGetPayload<{
    include: {
        players: true;
        guesses: {
            include: { player: { select: { id: true; displayName: true } } };
        };
    };
}>;

export type CoopPlayerWithLobby = Prisma.CoopPlayerGetPayload<{
    include: { lobby: true };
}>;

export type CoopGuessWithPlayer = Prisma.CoopGuessGetPayload<{
    include: { player: { select: { id: true; displayName: true } } };
}>;

export type VictoryRow = Prisma.GameResultGetPayload<{
    select: {
        userId: true;
        user: { select: { name: true; image: true } };
        dailyWikiPage: { select: { date: true } };
    };
}>;

export type BestScoreRow = Prisma.GameResultGetPayload<{
    select: {
        userId: true;
        guessCount: true;
        hintsUsed: true;
        user: { select: { name: true; image: true } };
        dailyWikiPage: { select: { title: true; date: true } };
    };
}>;

export interface MostWinsRow {
    userId: string;
    _count: { id: number };
}

export type GameResultWithDailyPage = Prisma.GameResultGetPayload<{
    include: { dailyWikiPage: { select: { date: true; title: true } } };
}>;
