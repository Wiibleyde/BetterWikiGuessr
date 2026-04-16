import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 5, // 5 minutes
            staleTime: 1000 * 60, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

export * from "./hook";
export * from "./queries";
