"use client";

import { useCallback } from "react";
import useSWR from "swr";
import type { AuthUser } from "@/types/auth";

const authFetcher = (url: string) =>
    fetch(url).then((res) => {
        if (!res.ok) return { user: null };
        return res.json();
    });

export function useAuth() {
    const { data, isLoading, mutate } = useSWR<{ user: AuthUser | null }>(
        "/api/auth/me",
        authFetcher,
        { revalidateOnFocus: false },
    );

    const user = data?.user ?? null;

    const login = useCallback(() => {
        window.location.href = "/api/auth/login";
    }, []);

    const logout = useCallback(async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        mutate({ user: null }, { revalidate: false });
    }, [mutate]);

    return { user, loading: isLoading, login, logout };
}
