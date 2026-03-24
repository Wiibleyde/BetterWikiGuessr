import {
    CLEANUP_INTERVAL_MS,
    MAX_REQUESTS,
    WINDOW_MS,
} from "@/constants/rate-limit";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

let cleanupScheduled = false;

function scheduleCleanup(): void {
    if (cleanupScheduled) return;
    cleanupScheduled = true;
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (entry.resetAt <= now) {
                store.delete(key);
            }
        }
    }, CLEANUP_INTERVAL_MS);
}

export function checkRateLimit(ip: string): {
    allowed: boolean;
    retryAfterMs: number;
} {
    scheduleCleanup();

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || entry.resetAt <= now) {
        store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, retryAfterMs: 0 };
    }

    entry.count++;

    if (entry.count > MAX_REQUESTS) {
        return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    return { allowed: true, retryAfterMs: 0 };
}
