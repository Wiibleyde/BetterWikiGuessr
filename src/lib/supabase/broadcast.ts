import env from "@/env";

/**
 * Broadcast to a co-op lobby using Supabase Realtime HTTP API.
 * Stateless — no WebSocket connection needed on the server side.
 */
export async function broadcastToLobby(
    code: string,
    event: string,
    payload: Record<string, unknown>,
): Promise<void> {
    const url = `${env.SUPABASE_INTERNAL_URL || env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`;
    const key = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messages: [
                {
                    topic: `coop:${code}`,
                    event,
                    payload,
                    private: false,
                },
            ],
        }),
    });

    if (!response.ok) {
        console.error(
            "[broadcast] failed:",
            response.status,
            await response.text(),
        );
    }
}

export function removeCoopChannel(_code: string): void {
    // No-op: HTTP broadcast is stateless, nothing to clean up
}
