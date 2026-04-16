import { NextResponse } from "next/server";
import env from "@/env";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const rawNext = searchParams.get("next") ?? "/";
    const siteUrl = env.SITE_URL.trim().replace(/\/+$/, "") || origin;

    // Prevent open redirects: only allow relative paths
    const next =
        rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

    if (code) {
        const supabase = await createServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(new URL(next, siteUrl));
        }
    }

    return NextResponse.redirect(new URL("/", siteUrl));
}
