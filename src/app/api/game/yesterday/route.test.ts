import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";
import "@/test/mocks/gameModule";

const getCachedYesterdayTitleMock = mock();

mock.module("@/lib/game/yesterday", () => ({
    getCachedYesterdayTitle: getCachedYesterdayTitleMock,
}));

const { GET } = await import("./route");

describe("GET /api/game/yesterday", () => {
    beforeEach(() => {
        getCachedYesterdayTitleMock.mockReset();
    });

    it("returns the yesterday title", async () => {
        getCachedYesterdayTitleMock.mockResolvedValue("Tour Eiffel");

        const res = await GET(
            new NextRequest("http://localhost/api/game/yesterday"),
        );
        const body = (await res.json()) as { title: string };

        expect(res.status).toBe(200);
        expect(body.title).toBe("Tour Eiffel");
    });

    it("returns null when no yesterday article", async () => {
        getCachedYesterdayTitleMock.mockResolvedValue(null);

        const res = await GET(
            new NextRequest("http://localhost/api/game/yesterday"),
        );
        const body = (await res.json()) as { title: null };

        expect(res.status).toBe(200);
        expect(body.title).toBeNull();
    });
});
