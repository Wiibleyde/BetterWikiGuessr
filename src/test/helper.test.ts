import { describe, expect, it } from "bun:test";
import { applyPositions, plural, posKey } from "@/utils/helper";

describe("plural", () => {
    it("returns singular when count is 1", () => {
        expect(plural(1, "lettre", "lettres")).toBe("1 lettre");
    });

    it("returns plural when count is 0", () => {
        expect(plural(0, "lettre", "lettres")).toBe("0 lettres");
    });

    it("returns plural when count is greater than 1", () => {
        expect(plural(3, "mot", "mots")).toBe("3 mots");
    });
});

describe("posKey", () => {
    it("builds a colon-separated key", () => {
        expect(posKey(0, "title", 2)).toBe("0:title:2");
    });

    it("handles negative section", () => {
        expect(posKey(-1, "content", 0)).toBe("-1:content:0");
    });
});

describe("applyPositions", () => {
    it("adds positions to an empty map", () => {
        const result = applyPositions({}, [
            { section: 0, part: "title", wordIndex: 0, display: "Tour" },
            { section: 0, part: "content", wordIndex: 1, display: "domine" },
        ]);

        expect(result["0:title:0"]).toBe("Tour");
        expect(result["0:content:1"]).toBe("domine");
    });

    it("preserves existing entries", () => {
        const prev = { "0:title:0": "La" };
        const result = applyPositions(prev, [
            { section: 1, part: "content", wordIndex: 3, display: "Paris" },
        ]);

        expect(result["0:title:0"]).toBe("La");
        expect(result["1:content:3"]).toBe("Paris");
    });

    it("does not mutate the original map", () => {
        const prev = { "0:title:0": "La" };
        applyPositions(prev, [
            { section: 0, part: "title", wordIndex: 1, display: "tour" },
        ]);

        expect(prev).toEqual({ "0:title:0": "La" });
    });
});
