import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import env from "@/env";

function getUrl(): string {
    return env.SUPABASE_INTERNAL_URL || env.NEXT_PUBLIC_SUPABASE_URL;
}

function getKey(): string {
    return env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * Creates a Supabase server client using Next.js `cookies()`.
 * Suitable for Server Components, Server Actions, and Route Handlers.
 */
export async function createServerClient(): Promise<SupabaseClient> {
    const cookieStore = await cookies();

    return createSSRServerClient(getUrl(), getKey(), {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    cookieStore.set(name, value, options);
                }
            },
        },
    });
}

/**
 * Creates a Supabase server client from a NextRequest.
 * Suitable for middleware and `withAuth` wrappers where cookies() is not available.
 */
export function createServerClientFromRequest(
    request: NextRequest,
    response?: NextResponse,
): SupabaseClient {
    const res = response ?? NextResponse.next({ request });

    return createSSRServerClient(getUrl(), getKey(), {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                for (const { name, value, options } of cookiesToSet) {
                    request.cookies.set(name, value);
                    res.cookies.set(name, value, options);
                }
            },
        },
    });
}
