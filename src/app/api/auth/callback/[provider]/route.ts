import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request): Promise<NextResponse> {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const rawNext = searchParams.get("next") ?? "/";

    // Prevent open redirects: only allow relative paths
    const next =
        rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

    if (code) {
        const supabase = await createServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(new URL(next, origin));
        }
    }

    return NextResponse.redirect(new URL("/", origin));
}
