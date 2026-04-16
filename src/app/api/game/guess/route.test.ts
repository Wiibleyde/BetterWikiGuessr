import { describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";
import "@/test/mocks/articleRepoModule";
import { checkGuessMock } from "@/test/mocks/gameModule";

const checkRateLimitMock = mock();

mock.module("@/lib/auth/rate-limit", () => ({
    checkRateLimit: checkRateLimitMock,
}));

const { POST } = await import("./route");

function createRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/game/guess", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-real-ip": "127.0.0.1",
        },
        body: JSON.stringify(body),
    });
}

describe("POST /api/game/guess", () => {
    it("retourne 429 si rate-limit dépassé", async () => {
        checkRateLimitMock.mockReturnValue({
            allowed: false,
            retryAfterMs: 2500,
        });

        const response = await POST(createRequest({ word: "test" }));
        const body = (await response.json()) as { error: string };

        expect(response.status).toBe(429);
        expect(body.error).toContain("Trop de requêtes");
        expect(response.headers.get("Retry-After")).toBe("3");
    });

    it("retourne 400 si le mot est invalide", async () => {
        checkRateLimitMock.mockReturnValue({ allowed: true, retryAfterMs: 0 });

        const response = await POST(createRequest({ word: "" }));
        const body = (await response.json()) as { error: string };

        expect(response.status).toBe(400);
        expect(body.error).toBe("Mot manquant");
    });

    it("retourne le résultat du moteur de jeu", async () => {
        checkRateLimitMock.mockReturnValue({ allowed: true, retryAfterMs: 0 });
        checkGuessMock.mockResolvedValue({
            found: true,
            word: "tour",
            positions: [],
            occurrences: 1,
            similarity: 1,
            serverDate: "2026-03-06",
        });

        const response = await POST(
            createRequest({ word: " tour ", revealedWords: ["eiffel"] }),
        );
        const body = (await response.json()) as {
            found: boolean;
            word: string;
        };

        expect(response.status).toBe(200);
        expect(body.found).toBe(true);
        expect(body.word).toBe("tour");
        expect(checkGuessMock).toHaveBeenCalledWith("tour", ["eiffel"]);
    });
});
