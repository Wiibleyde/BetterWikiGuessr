import { beforeEach, describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import "@/test/mocks/articleRepoModule";
import { getSessionMock } from "@/test/mocks/authModule";
import { ensureDailyWikiPageMock } from "@/test/mocks/dailyWikiModule";
import { verifyWinMock } from "@/test/mocks/gameModule";
import { createOrUpdateGameResultMock } from "@/test/mocks/gameResultRepoModule";

await import("@/lib/errors/gameError");
const { POST } = await import("./route");

const fakeUser = { id: "user-1", name: "Alice", email: "a@b.com" };

function jsonRequest(body: unknown): NextRequest {
    return new NextRequest("http://localhost/api/game/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/game/complete", () => {
    beforeEach(() => {
        getSessionMock.mockReset();
        verifyWinMock.mockReset();
        ensureDailyWikiPageMock.mockReset();
        createOrUpdateGameResultMock.mockReset();
        getSessionMock.mockResolvedValue({ user: fakeUser });
    });

    it("returns 401 if not authenticated", async () => {
        getSessionMock.mockResolvedValue(null);

        const res = await POST(
            jsonRequest({ guessCount: 5, guessedWords: ["tour"] }),
        );
        expect(res.status).toBe(401);
    });

    it("returns 400 for invalid guessCount", async () => {
        const res = await POST(
            jsonRequest({ guessCount: -1, guessedWords: ["tour"] }),
        );
        expect(res.status).toBe(400);
    });

    it("returns 400 for missing guessedWords", async () => {
        const res = await POST(
            jsonRequest({ guessCount: 5, guessedWords: [] }),
        );
        expect(res.status).toBe(400);
    });

    it("returns success on valid completion", async () => {
        verifyWinMock.mockResolvedValue(true);
        ensureDailyWikiPageMock.mockResolvedValue({
            id: "page-1",
            date: new Date(),
        });
        createOrUpdateGameResultMock.mockResolvedValue({ id: 42 });

        const res = await POST(
            jsonRequest({
                guessCount: 5,
                guessedWords: ["tour", "eiffel"],
                hintsUsed: 1,
            }),
        );
        const body = (await res.json()) as {
            success: boolean;
            resultId: number;
        };

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.resultId).toBe(42);
    });

    it("returns 400 on GameVerificationError", async () => {
        verifyWinMock.mockResolvedValue(false);

        const res = await POST(
            jsonRequest({ guessCount: 5, guessedWords: ["tour"] }),
        );
        expect(res.status).toBe(400);
    });
});
