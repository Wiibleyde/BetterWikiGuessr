import { createClient } from "@supabase/supabase-js";
import env from "@/env";

let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseServerClient() {
    if (client) return client;
    client = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    return client;
}
