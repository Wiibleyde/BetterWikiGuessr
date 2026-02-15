import { NextResponse } from "next/server";
import { setStateCookie } from "@/lib/auth";
import { generateState } from "@/lib/jwt";

export const dynamic = "force-dynamic";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI ?? "";
const DISCORD_AUTHORIZE_URL = "https://discord.com/api/oauth2/authorize";

export async function GET(): Promise<NextResponse> {
    if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
        return NextResponse.json(
            { error: "Configuration Discord manquante" },
            { status: 500 },
        );
    }

    const state = generateState();

    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: DISCORD_REDIRECT_URI,
        response_type: "code",
        scope: "identify",
        state,
    });

    const response = NextResponse.redirect(
        `${DISCORD_AUTHORIZE_URL}?${params.toString()}`,
    );

    setStateCookie(response, state);

    return response;
}
