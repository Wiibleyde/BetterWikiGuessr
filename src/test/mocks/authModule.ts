import { mock } from "bun:test";

export const getSessionMock = mock();

mock.module("@/lib/auth/auth", () => ({
    auth: {
        api: { getSession: getSessionMock },
    },
}));
