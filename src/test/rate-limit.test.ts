import { describe, expect, it } from "bun:test";
import { MAX_REQUESTS } from "@/constants/rate-limit";
import { checkRateLimit } from "@/lib/auth/rate-limit";

describe("checkRateLimit", () => {
    const testIp = `test-${Date.now()}`;

    it("allows the first request", () => {
        const ip = `${testIp}-first`;
        const result = checkRateLimit(ip);

        expect(result.allowed).toBe(true);
        expect(result.retryAfterMs).toBe(0);
    });

    it("allows requests up to MAX_REQUESTS", () => {
        const ip = `${testIp}-max`;
        for (let i = 0; i < MAX_REQUESTS; i++) {
            const result = checkRateLimit(ip);
            expect(result.allowed).toBe(true);
        }
    });

    it("rejects requests beyond MAX_REQUESTS", () => {
        const ip = `${testIp}-exceed`;
        for (let i = 0; i < MAX_REQUESTS; i++) {
            checkRateLimit(ip);
        }

        const result = checkRateLimit(ip);
        expect(result.allowed).toBe(false);
        expect(result.retryAfterMs).toBeGreaterThan(0);
    });
});
