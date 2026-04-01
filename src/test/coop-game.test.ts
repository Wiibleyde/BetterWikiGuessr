import { beforeEach, describe, expect, it } from "bun:test";

const {
    getOrBuildCoopCache,
    getCoopCache,
    getCoopMaskedArticle,
    checkCoopGuess,
    verifyCoopWin,
    removeCoopCache,
    cleanupCoopCaches,
} = await import("@/lib/game/coop-game");

const SECTIONS = [
    { title: "Tour Eiffel", content: "La tour domine Paris." },
    { title: "Histoire", content: "Construite pour exposition universelle." },
];

describe("coop-game cache management", () => {
    beforeEach(() => {
        removeCoopCache("TEST01");
        removeCoopCache("TEST02");
    });

    it("builds and returns an article cache", () => {
        const cache = getOrBuildCoopCache(
            "TEST01",
            "Tour Eiffel",
            SECTIONS,
            "2026-03-31",
        );

        expect(cache).toBeDefined();
        expect(cache.maskedArticle).toBeDefined();
        expect(cache.maskedArticle.totalWords).toBeGreaterThan(0);
        expect(cache.maskedArticle.date).toBe("2026-03-31");
    });

    it("returns the same cache on repeated calls", () => {
        const first = getOrBuildCoopCache(
            "TEST01",
            "Tour Eiffel",
            SECTIONS,
            "2026-03-31",
        );
        const second = getOrBuildCoopCache(
            "TEST01",
            "Tour Eiffel",
            SECTIONS,
            "2026-03-31",
        );

        expect(first).toBe(second);
    });

    it("getCoopCache returns null for unknown lobby", () => {
        expect(getCoopCache("UNKNOWN")).toBeNull();
    });

    it("getCoopCache returns cache after build", () => {
        getOrBuildCoopCache("TEST01", "Tour Eiffel", SECTIONS, "2026-03-31");
        const cache = getCoopCache("TEST01");
        expect(cache).not.toBeNull();
    });

    it("getCoopMaskedArticle returns the masked article", () => {
        getOrBuildCoopCache("TEST01", "Tour Eiffel", SECTIONS, "2026-03-31");
        const article = getCoopMaskedArticle("TEST01");
        expect(article).not.toBeNull();
        expect(article?.sections.length).toBe(SECTIONS.length);
    });

    it("getCoopMaskedArticle returns null for unknown lobby", () => {
        expect(getCoopMaskedArticle("UNKNOWN")).toBeNull();
    });

    it("removeCoopCache clears the cache", () => {
        getOrBuildCoopCache("TEST01", "Tour Eiffel", SECTIONS, "2026-03-31");
        removeCoopCache("TEST01");
        expect(getCoopCache("TEST01")).toBeNull();
    });
});

describe("coop-game guess checking", () => {
    beforeEach(() => {
        removeCoopCache("GUESS1");
        getOrBuildCoopCache("GUESS1", "Tour Eiffel", SECTIONS, "2026-03-31");
    });

    it("returns null when cache does not exist", () => {
        expect(checkCoopGuess("NOTEXIST", "tour")).toBeNull();
    });

    it("finds an exact match", () => {
        const result = checkCoopGuess("GUESS1", "tour");
        expect(result).not.toBeNull();
        expect(result?.found).toBe(true);
        expect(result?.word).toBe("tour");
        expect(result?.occurrences).toBeGreaterThan(0);
    });

    it("returns not found for a random word", () => {
        const result = checkCoopGuess("GUESS1", "banane");
        expect(result).not.toBeNull();
        expect(result?.found).toBe(false);
    });

    it("skips already revealed words", () => {
        const result = checkCoopGuess("GUESS1", "tourr", ["tour"]);
        expect(result).not.toBeNull();
        expect(result?.found).toBe(false);
    });
});

describe("coop-game win verification", () => {
    beforeEach(() => {
        removeCoopCache("WIN01");
        getOrBuildCoopCache("WIN01", "Tour Eiffel", SECTIONS, "2026-03-31");
    });

    it("returns false for unknown lobby", () => {
        expect(verifyCoopWin("NOTEXIST", ["tour", "eiffel"])).toBe(false);
    });

    it("returns true when all title words are guessed", () => {
        expect(verifyCoopWin("WIN01", ["tour", "eiffel"])).toBe(true);
    });

    it("returns false when title words are incomplete", () => {
        expect(verifyCoopWin("WIN01", ["tour"])).toBe(false);
    });
});

describe("cleanupCoopCaches", () => {
    beforeEach(() => {
        removeCoopCache("OLD01");
        removeCoopCache("NEW01");
    });

    it("removes caches older than maxAgeMs", async () => {
        getOrBuildCoopCache("OLD01", "Tour Eiffel", SECTIONS, "2026-03-31");
        // Wait a tiny bit so lastAccess is in the past
        await new Promise((r) => setTimeout(r, 5));
        cleanupCoopCaches(1);
        expect(getCoopCache("OLD01")).toBeNull();
    });

    it("keeps recent caches", () => {
        getOrBuildCoopCache("NEW01", "Tour Eiffel", SECTIONS, "2026-03-31");
        cleanupCoopCaches(60_000);
        expect(getCoopCache("NEW01")).not.toBeNull();
    });
});
