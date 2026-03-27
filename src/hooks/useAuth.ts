"use client";

import { useCallback } from "react";
import { authClient } from "@/lib/auth/client";
import type { AuthUser } from "@/types/auth";

type SocialProvider = Parameters<
    typeof authClient.signIn.social
>[0]["provider"];

export function useAuth(): {
    user: AuthUser | null;
    loading: boolean;
    login: (provider?: SocialProvider) => void;
    logout: () => Promise<void>;
} {
    const { data: session, isPending } = authClient.useSession();

    const user = (session?.user as AuthUser | undefined) ?? null;

    const login = useCallback((provider: SocialProvider = "discord") => {
        authClient.signIn.social({ provider });
    }, []);

    const logout = useCallback(async () => {
        await authClient.signOut();
    }, []);

    return { user, loading: isPending, login, logout };
}
