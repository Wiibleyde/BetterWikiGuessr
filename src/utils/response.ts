import { NextResponse } from "next/server";

export function ok(
    data: unknown,
    status = 200,
    headers?: Record<string, string>,
): NextResponse {
    return NextResponse.json(data, { status, headers });
}

export function err(message: string, status: number): NextResponse {
    return NextResponse.json({ error: message }, { status });
}
