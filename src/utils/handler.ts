import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import type { AuthUser } from "@/types/auth";
import { err } from "./response";

type Handler<TArgs extends unknown[] = []> = (
    request: NextRequest,
    ...args: TArgs
) => Promise<NextResponse>;
type AuthHandler = (
    request: NextRequest,
    user: AuthUser,
) => Promise<NextResponse>;
type OptionalAuthHandler = (
    request: NextRequest,
    user: AuthUser | null,
) => Promise<NextResponse>;

/**
 * Catches unhandled errors and returns a 500 response with a French error message.
 * Logs the error with a context prefix derived from the URL path.
 */
export function withErrorHandler<TArgs extends unknown[]>(
    handler: Handler<TArgs>,
): Handler<TArgs> {
    return async (
        request: NextRequest,
        ...args: TArgs
    ): Promise<NextResponse> => {
        try {
            return await handler(request, ...args);
        } catch (error) {
            const path = new URL(request.url).pathname;
            console.error(`[${path}]`, error);
            return err("Erreur interne", 500);
        }
    };
}

/**
 * Verifies the BetterAuth session and injects the authenticated user into the handler.
 * Returns 401 if the user is not authenticated.
 */
export function withAuth(handler: AuthHandler): Handler {
    return async (request: NextRequest): Promise<NextResponse> => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.user) {
            return err("Non authentifié", 401);
        }
        return handler(request, session.user as AuthUser);
    };
}

/**
 * Verifies BetterAuth session when present and injects the user into the handler.
 * Passes null user for anonymous requests.
 */
export function withOptionalAuth(handler: OptionalAuthHandler): Handler {
    return async (request: NextRequest): Promise<NextResponse> => {
        const session = await auth.api.getSession({ headers: request.headers });
        const user = (session?.user as AuthUser | undefined) ?? null;
        return handler(request, user);
    };
}

/**
 * Enforces IP-based rate limiting using the in-memory rate limiter.
 * Returns 429 with a Retry-After header if the limit is exceeded.
 */
export function withRateLimit<TArgs extends unknown[]>(
    handler: Handler<TArgs>,
): Handler<TArgs> {
    return async (
        request: NextRequest,
        ...args: TArgs
    ): Promise<NextResponse> => {
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip") ??
            "unknown";

        const { allowed, retryAfterMs } = checkRateLimit(ip);
        if (!allowed) {
            return NextResponse.json(
                { error: "Trop de requêtes, réessayez dans quelques secondes" },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
                    },
                },
            );
        }

        return handler(request, ...args);
    };
}
