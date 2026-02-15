import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { AuthUser } from "@/types/auth";
import { prisma } from "../prisma";
import { verifyJWT } from "./jwt";

const AUTH_COOKIE = "wikiguessr-auth";
const STATE_COOKIE = "wikiguessr-oauth-state";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export async function getSessionUser(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (!token) return null;

    const payload = verifyJWT(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, discordId: true, username: true, avatar: true },
    });

    return user;
}

export function setAuthCookie(response: NextResponse, token: string): void {
    response.cookies.set(AUTH_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
    });
}

export function clearAuthCookie(response: NextResponse): void {
    response.cookies.set(AUTH_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
}

export function setStateCookie(response: NextResponse, state: string): void {
    response.cookies.set(STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 600, // 10 minutes
    });
}

export async function getStateCookie(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(STATE_COOKIE)?.value;
}

export function clearStateCookie(response: NextResponse): void {
    response.cookies.set(STATE_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
}
