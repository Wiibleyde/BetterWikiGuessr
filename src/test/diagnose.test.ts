import { describe, expect, it } from "bun:test";
import { diagnoseProximity } from "@/utils/similarity/diagnose";

describe("diagnoseProximity", () => {
    it("detects a single substitution (same length, dist 1)", () => {
        const result = diagnoseProximity("tour", "four");
        expect(result.type).toBe("substitution");
        expect(result.description).toBe("1 lettre différente");
    });

    it("detects two substitutions (same length, dist 2)", () => {
        // toxi vs tour: positions 2 and 3 differ → dist 2
        const result = diagnoseProximity("toxi", "tour");
        expect(result.type).toBe("mixed");
        expect(result.description).toBe("2 lettres différentes");
    });

    it("returns mixed for same-length words with dist > 2", () => {
        const result = diagnoseProximity("abcd", "wxyz");
        expect(result.type).toBe("mixed");
        expect(result.description).toBe("Mot très proche");
    });

    it("detects a single missing letter (deletion)", () => {
        const result = diagnoseProximity("tou", "tour");
        expect(result.type).toBe("deletion");
        expect(result.description).toBe("1 lettre manquante");
    });

    it("detects multiple missing letters", () => {
        const result = diagnoseProximity("to", "tour");
        expect(result.type).toBe("deletion");
        expect(result.description).toBe("2 lettres manquantes");
    });

    it("detects a single extra letter (insertion)", () => {
        const result = diagnoseProximity("tours", "tour");
        expect(result.type).toBe("insertion");
        expect(result.description).toBe("1 lettre en trop");
    });

    it("detects multiple extra letters", () => {
        const result = diagnoseProximity("tourss", "tour");
        expect(result.type).toBe("insertion");
        expect(result.description).toBe("2 lettres en trop");
    });

    it("returns mixed for different-length words with high distance", () => {
        const result = diagnoseProximity("abcdef", "xyz");
        expect(result.type).toBe("mixed");
        expect(result.description).toBe("Mot très proche");
    });
});
