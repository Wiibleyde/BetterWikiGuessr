import { type NextRequest, NextResponse } from "next/server";

export function proxy(_request: NextRequest): NextResponse {
    const response = NextResponse.next();
    response.headers.set("X-Request-Id", crypto.randomUUID());
    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ],
};
