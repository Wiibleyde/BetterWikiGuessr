import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/auth";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
    const response = NextResponse.json({ success: true });
    clearAuthCookie(response);
    return response;
}
