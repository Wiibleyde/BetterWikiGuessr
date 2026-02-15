import { type NextRequest, NextResponse } from "next/server";
import { clearStateCookie, getStateCookie, setAuthCookie } from "@/lib/auth";
import { signJWT } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? "";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI ?? "";
const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";

interface DiscordTokenResponse {
    access_token: string;
    token_type: string;
}

interface DiscordUser {
    id: string;
    username: string;
    avatar: string | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");

        if (errorParam) {
            console.error("[auth/callback] Discord error:", errorParam);
            return NextResponse.redirect(new URL("/", request.url));
        }

        if (!code || !state) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Verify CSRF state
        const storedState = await getStateCookie();
        if (!storedState || storedState !== state) {
            console.error("[auth/callback] State mismatch");
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Exchange code for token
        const tokenResponse = await fetch(DISCORD_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: DISCORD_REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            console.error(
                "[auth/callback] Token exchange failed:",
                await tokenResponse.text(),
            );
            return NextResponse.redirect(new URL("/", request.url));
        }

        const tokenData = (await tokenResponse.json()) as DiscordTokenResponse;

        // Fetch Discord user
        const userResponse = await fetch(DISCORD_USER_URL, {
            headers: {
                Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
            },
        });

        if (!userResponse.ok) {
            console.error(
                "[auth/callback] User fetch failed:",
                await userResponse.text(),
            );
            return NextResponse.redirect(new URL("/", request.url));
        }

        const discordUser = (await userResponse.json()) as DiscordUser;

        // Upsert user in database
        const user = await prisma.user.upsert({
            where: { discordId: discordUser.id },
            update: {
                username: discordUser.username,
                avatar: discordUser.avatar,
            },
            create: {
                discordId: discordUser.id,
                username: discordUser.username,
                avatar: discordUser.avatar,
            },
        });

        // Sign JWT and set cookie
        const token = signJWT({ userId: user.id, discordId: user.discordId });
        const response = NextResponse.redirect(new URL("/", request.url));
        setAuthCookie(response, token);
        clearStateCookie(response);

        return response;
    } catch (error) {
        console.error("[auth/callback]", error);
        return NextResponse.redirect(new URL("/", request.url));
    }
}
