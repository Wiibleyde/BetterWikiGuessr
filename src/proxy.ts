import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.next({ request });
    response.headers.set("X-Request-Id", crypto.randomUUID());

    // Refresh the Supabase auth session token via cookies
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key =
        process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "";

    if (url && key) {
        const supabase = createSSRServerClient(url, key, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    for (const { name, value, options } of cookiesToSet) {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    }
                },
            },
        });
        await supabase.auth.getUser();
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ],
};
