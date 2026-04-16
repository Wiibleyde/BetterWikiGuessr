"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AuthUser } from "@/types/auth";

export type SocialProvider = "discord";

export function useAuth(): {
    user: AuthUser | null;
    loading: boolean;
    login: (provider?: SocialProvider) => void;
    logout: () => Promise<void>;
} {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const {
                    data: { user: authUser },
                } = await supabase.auth.getUser();

                if (authUser) {
                    setUser({
                        id: authUser.id,
                        name:
                            authUser.user_metadata?.full_name ??
                            authUser.user_metadata?.name ??
                            authUser.email?.split("@")[0] ??
                            "Joueur",
                        email: authUser.email ?? "",
                        emailVerified: !!authUser.email_confirmed_at,
                        image: authUser.user_metadata?.avatar_url ?? null,
                        createdAt: new Date(authUser.created_at),
                        updatedAt: new Date(
                            authUser.updated_at ?? authUser.created_at,
                        ),
                    } as AuthUser);
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const u = session.user;
                setUser({
                    id: u.id,
                    name:
                        u.user_metadata?.full_name ??
                        u.user_metadata?.name ??
                        u.email?.split("@")[0] ??
                        "Joueur",
                    email: u.email ?? "",
                    emailVerified: !!u.email_confirmed_at,
                    image: u.user_metadata?.avatar_url ?? null,
                    createdAt: new Date(u.created_at),
                    updatedAt: new Date(u.updated_at ?? u.created_at),
                } as AuthUser);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = useCallback((provider: SocialProvider = "discord") => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback/${provider}`,
            },
        });
    }, []);

    const logout = useCallback(async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        await supabase.auth.signOut();
        setUser(null);
    }, []);

    return { user, loading, login, logout };
}
