import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

type RuntimeEnv = {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

function getRuntimeEnv(): RuntimeEnv {
    if (typeof window === "undefined") return {};

    return (
        (window as Window & { __WIKIGUESSR_ENV__?: RuntimeEnv })
            .__WIKIGUESSR_ENV__ ?? {}
    );
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
    if (client) return client;
    const runtimeEnv = getRuntimeEnv();
    const url =
        runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??
        process.env.NEXT_PUBLIC_SUPABASE_URL ??
        "";
    const key =
        runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        "";
    if (!url || !key) return null;
    client = createBrowserClient(url, key);
    return client;
}
