import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";
import { getMaskedArticleMock } from "@/test/mocks/gameModule";

const { GET } = await import("./route");

function makeRequest(): NextRequest {
    return new NextRequest("http://localhost/api/game");
}

describe("GET /api/game", () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
        console.error = mock(() => {});
    });

    afterEach(() => {
        console.error = originalConsoleError;
    });

    it("retourne l'article masqué avec headers no-cache", async () => {
        getMaskedArticleMock.mockResolvedValue({
            sections: [],
            totalWords: 0,
            date: "2026-03-06",
            imageCount: 0,
        });

        const response = await GET(makeRequest());
        const body = (await response.json()) as { date: string };

        expect(response.status).toBe(200);
        expect(body.date).toBe("2026-03-06");
        expect(response.headers.get("Cache-Control")).toContain("no-store");
    });

    it("retourne 500 avec le message d'erreur", async () => {
        getMaskedArticleMock.mockRejectedValue(new Error("boom"));

        const response = await GET(makeRequest());
        const body = (await response.json()) as { error: string };

        expect(response.status).toBe(500);
        expect(body.error).toBe("Erreur interne");
    });
});
