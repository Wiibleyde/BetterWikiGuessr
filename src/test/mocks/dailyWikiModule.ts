import { mock } from "bun:test";

export const ensureDailyWikiPageMock = mock();

mock.module("@/lib/game/daily-wiki", () => ({
    ensureDailyWikiPage: ensureDailyWikiPageMock,
}));
