import { mock } from "bun:test";

export const getGameStateByUserAndDailyPageMock = mock();
export const createOrUpdateGameStateMock = mock();

mock.module("@/lib/repositories/gameStateRepository", () => ({
    getGameStateByUserAndDailyPage: getGameStateByUserAndDailyPageMock,
    createOrUpdateGameState: createOrUpdateGameStateMock,
}));
