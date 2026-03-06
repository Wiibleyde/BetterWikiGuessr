import { beforeEach, describe, expect, it, mock } from "bun:test";

const ensureDailyWikiPageMock = mock();

mock.module("@/lib/game/daily-wiki", () => ({
    ensureDailyWikiPage: ensureDailyWikiPageMock,
}));

const { checkGuess, verifyWin } = await import("@/lib/game/game");

interface MockPage {
    id: string;
    date: Date;
    title: string;
    sections: Array<{ title: string; content: string }>;
    images: string[];
}

function createMockPage(dateIso: string): MockPage {
    return {
        id: "page-1",
        date: new Date(dateIso),
        title: "Tour Eiffel",
        sections: [
            {
                title: "Présentation",
                content: "La tour domine Paris.",
            },
        ],
        images: ["https://example.com/img.jpg"],
    };
}

describe("game core", () => {
    beforeEach(() => {
        ensureDailyWikiPageMock.mockReset();
    });

    it("retourne un match exact", async () => {
        ensureDailyWikiPageMock.mockResolvedValue(
            createMockPage("2026-03-06T00:00:00.000Z"),
        );

        const result = await checkGuess("tour");

        expect(result.found).toBe(true);
        expect(result.word).toBe("tour");
        expect(result.occurrences).toBeGreaterThan(0);
        expect(result.similarity).toBe(1);
    });

    it("auto-reveal un mot à distance 1", async () => {
        ensureDailyWikiPageMock.mockResolvedValue(
            createMockPage("2026-03-07T00:00:00.000Z"),
        );

        const result = await checkGuess("eiffle");

        expect(result.found).toBe(true);
        expect(result.word).toBe("eiffel");
        expect(result.similarity).toBe(1);
    });

    it("ne révèle pas un mot déjà trouvé via revealedWords", async () => {
        ensureDailyWikiPageMock.mockResolvedValue(
            createMockPage("2026-03-08T00:00:00.000Z"),
        );

        const result = await checkGuess("tourr", ["tour"]);

        expect(result.found).toBe(false);
        expect(result.positions).toHaveLength(0);
    });

    it("valide une victoire quand tous les mots du titre sont trouvés", async () => {
        ensureDailyWikiPageMock.mockResolvedValue(
            createMockPage("2026-03-09T00:00:00.000Z"),
        );

        const isWin = await verifyWin(["tour", "eiffel"]);

        expect(isWin).toBe(true);
    });

    it("refuse la victoire si un mot du titre manque", async () => {
        ensureDailyWikiPageMock.mockResolvedValue(
            createMockPage("2026-03-10T00:00:00.000Z"),
        );

        const isWin = await verifyWin(["tour"]);

        expect(isWin).toBe(false);
    });
});
