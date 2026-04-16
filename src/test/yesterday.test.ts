import { describe, expect, it } from "bun:test";
import { getYesterdaysArticleMock } from "@/test/mocks/articleRepoModule";

const { getCachedYesterdayTitle } = await import("@/lib/game/yesterday");

describe("getCachedYesterdayTitle", () => {
    it("loads title from repository on cache miss", async () => {
        getYesterdaysArticleMock.mockResolvedValue({ title: "Tour Eiffel" });

        const title = await getCachedYesterdayTitle();
        expect(title).toBe("Tour Eiffel");
        expect(getYesterdaysArticleMock).toHaveBeenCalledTimes(1);
    });

    it("returns cached value without calling repository again", async () => {
        getYesterdaysArticleMock.mockClear();

        const title = await getCachedYesterdayTitle();
        expect(title).toBe("Tour Eiffel");
        expect(getYesterdaysArticleMock).toHaveBeenCalledTimes(0);
    });
});
