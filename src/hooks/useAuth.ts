"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((res) => {
                if (!res.ok) return null;
                return res.json();
            })
            .then((data) => {
                if (data?.user) setUser(data.user as AuthUser);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(() => {
        window.location.href = "/api/auth/login";
    }, []);

    const logout = useCallback(async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setUser(null);
    }, []);

    return { user, loading, login, logout };
}
