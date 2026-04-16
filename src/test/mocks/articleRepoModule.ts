import { mock } from "bun:test";

export const createArticleMock = mock();
export const getTodaysArticleMock = mock();
export const getYesterdaysArticleMock = mock();
export const getArticleLtDateMock = mock();

mock.module("@/lib/repositories/articleRepository", () => ({
    createArticle: createArticleMock,
    getTodaysArticle: getTodaysArticleMock,
    getYesterdaysArticle: getYesterdaysArticleMock,
    getArticleLtDate: getArticleLtDateMock,
}));
