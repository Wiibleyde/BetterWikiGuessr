import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";
import env from "@/env";
import {
    clearStateCookie,
    getStateCookie,
    setAuthCookie,
} from "@/lib/auth/auth";
import { signJWT } from "@/lib/auth/jwt";
import { createUser } from "@/lib/repositories/userRepository";

export const dynamic = "force-dynamic";

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_USER_URL = "https://discord.com/api/users/@me";

interface DiscordTokenResponse {
    access_token: string;
    token_type: string;
}

export interface DiscordUser {
    id: string;
    username: string;
    avatar: string | null;
}

function serializeAxiosData(data: unknown): string {
    return typeof data === "string" ? data : JSON.stringify(data);
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

        const storedState = await getStateCookie();
        if (!storedState || storedState !== state) {
            console.error("[auth/callback] State mismatch");
            return NextResponse.redirect(new URL("/", request.url));
        }

        const tokenResponse = await axios.post<DiscordTokenResponse>(
            DISCORD_TOKEN_URL,
            new URLSearchParams({
                client_id: env.DISCORD_CLIENT_ID,
                client_secret: env.DISCORD_CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: env.DISCORD_REDIRECT_URI,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                validateStatus: () => true,
            },
        );

        if (tokenResponse.status < 200 || tokenResponse.status >= 300) {
            console.error(
                "[auth/callback] Token exchange failed:",
                serializeAxiosData(tokenResponse.data),
            );
            return NextResponse.redirect(new URL("/", request.url));
        }

        const tokenData = tokenResponse.data;

        const userResponse = await axios.get<DiscordUser>(DISCORD_USER_URL, {
            headers: {
                Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
            },
            validateStatus: () => true,
        });

        if (userResponse.status < 200 || userResponse.status >= 300) {
            console.error(
                "[auth/callback] User fetch failed:",
                serializeAxiosData(userResponse.data),
            );
            return NextResponse.redirect(new URL("/", request.url));
        }
        const discordUser = userResponse.data;

        const user = await createUser(discordUser);

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
