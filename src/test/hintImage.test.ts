import { describe, expect, it } from "bun:test";
import { buildHintImageUrl, normalizeHintImageUrls } from "@/utils/hintImage";

describe("buildHintImageUrl", () => {
    it("builds a URL with the given index", () => {
        expect(buildHintImageUrl(0)).toBe("/api/game/hint/image?index=0");
    });

    it("handles higher indices", () => {
        expect(buildHintImageUrl(5)).toBe("/api/game/hint/image?index=5");
    });
});

describe("normalizeHintImageUrls", () => {
    it("returns empty array for undefined", () => {
        expect(normalizeHintImageUrls(undefined)).toEqual([]);
    });

    it("returns empty array for empty array", () => {
        expect(normalizeHintImageUrls([])).toEqual([]);
    });

    it("replaces original URLs with normalized hint URLs", () => {
        const urls = [
            "https://example.com/img1.jpg",
            "https://example.com/img2.jpg",
        ];
        const result = normalizeHintImageUrls(urls);

        expect(result).toEqual([
            "/api/game/hint/image?index=0",
            "/api/game/hint/image?index=1",
        ]);
    });
});
