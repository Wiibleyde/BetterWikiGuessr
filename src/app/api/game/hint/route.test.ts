import { beforeEach, describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import { getSessionMock } from "@/test/mocks/authModule";
import { ensureDailyWikiPageMock } from "@/test/mocks/dailyWikiModule";
import { getHintImageMock } from "@/test/mocks/gameModule";
import { getGameStateByUserAndDailyPageMock } from "@/test/mocks/gameStateRepoModule";

await import("@/lib/errors/gameError");
const { POST } = await import("./route");

function jsonRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/game/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/game/hint", () => {
    beforeEach(() => {
        getSessionMock.mockReset();
        getHintImageMock.mockReset();
        ensureDailyWikiPageMock.mockReset();
        getGameStateByUserAndDailyPageMock.mockReset();
        getSessionMock.mockResolvedValue(null);
    });

    it("returns 400 for invalid hintIndex", async () => {
        const res = await POST(jsonRequest({ hintIndex: -1 }));
        expect(res.status).toBe(400);
    });

    it("returns 400 for non-numeric hintIndex", async () => {
        const res = await POST(jsonRequest({ hintIndex: "abc" }));
        expect(res.status).toBe(400);
    });

    it("returns hint result on success (anonymous with won)", async () => {
        getHintImageMock.mockResolvedValue({
            hintIndex: 0,
            totalImages: 2,
        });

        const res = await POST(
            jsonRequest({
                hintIndex: 0,
                guesses: ["tour", "eiffel"],
                won: true,
            }),
        );
        const body = (await res.json()) as { hintIndex: number };

        expect(res.status).toBe(200);
        expect(body.hintIndex).toBe(0);
    });

    it("returns 403 when hint is locked", async () => {
        const res = await POST(
            jsonRequest({ hintIndex: 0, guesses: [], won: false }),
        );
        expect(res.status).toBe(403);
    });

    it("returns 404 when image doesn't exist", async () => {
        getHintImageMock.mockResolvedValue(null);

        const res = await POST(
            jsonRequest({ hintIndex: 99, guesses: [], won: true }),
        );
        expect(res.status).toBe(404);
    });
});
