"use client";

import { useCallback } from "react";
import { authClient } from "@/lib/auth/client";
import type { AuthUser } from "@/types/auth";

export function useAuth(): {
    user: AuthUser | null;
    loading: boolean;
    login: () => void;
    logout: () => Promise<void>;
} {
    const { data: session, isPending } = authClient.useSession();

    const user = (session?.user as AuthUser | undefined) ?? null;

    const login = useCallback(() => {
        authClient.signIn.social({ provider: "discord" });
    }, []);

    const logout = useCallback(async () => {
        await authClient.signOut();
    }, []);

    return { user, loading: isPending, login, logout };
}
