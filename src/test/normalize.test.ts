import { describe, expect, it } from "bun:test";
import { normalizeWord } from "@/lib/game/normalize";

describe("normalizeWord", () => {
    it("normalise la casse, les ligatures et les accents", () => {
        expect(normalizeWord("Œuvre")).toBe("oeuvre");
        expect(normalizeWord("Éléphant")).toBe("elephant");
        expect(normalizeWord("Straße")).toBe("strasse");
    });

    it("conserve la ponctuation et les espaces", () => {
        expect(normalizeWord("  À-bord !  ")).toBe("  a-bord !  ");
    });
});
