import { mock } from "bun:test";

export const getSessionMock = mock();
export const findUniqueMock = mock();
export const exchangeCodeForSessionMock = mock(async () => ({
    data: {},
    error: null,
}));

mock.module("@/lib/supabase/server", () => ({
    createServerClient: () => ({
        auth: {
            getUser: async () => {
                const result = await getSessionMock();
                if (result?.user) {
                    return {
                        data: { user: { id: result.user.id } },
                        error: null,
                    };
                }
                return { data: { user: null }, error: null };
            },
            exchangeCodeForSession: exchangeCodeForSessionMock,
        },
    }),
    createServerClientFromRequest: () => ({
        auth: {
            getUser: async () => {
                const result = await getSessionMock();
                if (result?.user) {
                    return {
                        data: { user: { id: result.user.id } },
                        error: null,
                    };
                }
                return { data: { user: null }, error: null };
            },
        },
    }),
}));

// withAuth now queries prisma.user.findUnique to get the profile
findUniqueMock.mockImplementation(
    async ({ where }: { where: { id: string } }) => {
        const result = await getSessionMock();
        return result?.user?.id === where.id ? result.user : null;
    },
);

mock.module("@/lib/prisma", () => ({
    prisma: {
        user: {
            findUnique: findUniqueMock,
        },
    },
}));
