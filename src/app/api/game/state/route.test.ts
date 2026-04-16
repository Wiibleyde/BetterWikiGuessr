import { describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import "@/test/mocks/articleRepoModule";
import "@/test/mocks/gameModule";
import { getSessionMock } from "@/test/mocks/authModule";
import { ensureDailyWikiPageMock } from "@/test/mocks/dailyWikiModule";
import {
    createOrUpdateGameStateMock,
    getGameStateByUserAndDailyPageMock,
} from "@/test/mocks/gameStateRepoModule";

const { GET, PUT } = await import("./route");

function makeRequest(method = "GET", body?: unknown): NextRequest {
    return new NextRequest("http://localhost/api/game/state", {
        method,
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

describe("GET /api/game/state", () => {
    it("retourne 401 si non authentifié", async () => {
        getSessionMock.mockResolvedValue(null);

        const response = await GET(makeRequest());
        expect(response.status).toBe(401);
    });

    it("retourne state null si aucun état n'existe", async () => {
        getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
        ensureDailyWikiPageMock.mockResolvedValue({ id: "page-1" });
        getGameStateByUserAndDailyPageMock.mockResolvedValue(null);

        const response = await GET(makeRequest());
        const body = (await response.json()) as { state: null };

        expect(response.status).toBe(200);
        expect(body.state).toBeNull();
    });
});

describe("PUT /api/game/state", () => {
    it("retourne 401 si non authentifié", async () => {
        getSessionMock.mockResolvedValue(null);

        const response = await PUT(
            makeRequest("PUT", { guesses: [], revealed: {} }),
        );
        expect(response.status).toBe(401);
    });

    it("retourne 400 si payload invalide", async () => {
        getSessionMock.mockResolvedValue({ user: { id: "user-1" } });

        const response = await PUT(
            makeRequest("PUT", { guesses: "bad", revealed: {} }),
        );
        const body = (await response.json()) as { error: string };

        expect(response.status).toBe(400);
        expect(body.error).toBe("Données invalides");
    });

    it("upsert l'état courant quand payload valide", async () => {
        getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
        ensureDailyWikiPageMock.mockResolvedValue({ id: "page-1" });
        createOrUpdateGameStateMock.mockResolvedValue({});

        const response = await PUT(
            makeRequest("PUT", {
                guesses: [
                    {
                        word: "tour",
                        found: true,
                        occurrences: 1,
                        similarity: 1,
                    },
                ],
                revealed: { "-1:title:0": "Tour" },
                saved: true,
                revealedImages: ["https://example.com/img.jpg"],
            }),
        );
        const body = (await response.json()) as { success: boolean };

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(createOrUpdateGameStateMock).toHaveBeenCalled();
    });
});
