import { mock } from "bun:test";

export const getMaskedArticleMock = mock();
export const checkGuessMock = mock();
export const verifyWinMock = mock();
export const getAllWordPositionsMock = mock();
export const getHintImageMock = mock();
export const getImageCountMock = mock();
export const addToWordsGroupMock = mock();
export const buildArticleCacheMock = mock();
export const checkGuessAgainstCacheMock = mock();
export const verifyWinAgainstCacheMock = mock();

mock.module("@/lib/game/game", () => ({
    getMaskedArticle: getMaskedArticleMock,
    checkGuess: checkGuessMock,
    verifyWin: verifyWinMock,
    getAllWordPositions: getAllWordPositionsMock,
    getHintImage: getHintImageMock,
    getImageCount: getImageCountMock,
    addToWordsGroup: addToWordsGroupMock,
    buildArticleCache: buildArticleCacheMock,
    checkGuessAgainstCache: checkGuessAgainstCacheMock,
    verifyWinAgainstCache: verifyWinAgainstCacheMock,
}));
