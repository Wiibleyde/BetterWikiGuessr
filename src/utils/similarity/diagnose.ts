// ---------------------------------------------------------------------------
//  Proximity diagnosis — explains WHY a guess is close to a target word.
//  Returns a human-readable French description + a type tag for UI icons.
// ---------------------------------------------------------------------------

import type { ProximityReason } from "@/types/game";
import { plural } from "../helper";
import { levenshteinDistance } from "./levenstein";

function isAdjacentTransposition(guess: string, target: string): boolean {
    for (let i = 0; i < guess.length - 1; i++) {
        if (
            guess[i] === target[i + 1] &&
            guess[i + 1] === target[i] &&
            guess.substring(0, i) === target.substring(0, i) &&
            guess.substring(i + 2) === target.substring(i + 2)
        ) {
            return true;
        }
    }
    return false;
}

function diagnoseSameLengthWords(
    guess: string,
    target: string,
    levenshteinDistance: number,
): ProximityReason {
    if (levenshteinDistance === 1) {
        return isAdjacentTransposition(guess, target)
            ? { type: "transposition", description: "Lettres inversées" }
            : { type: "substitution", description: "1 lettre différente" };
    }
    if (levenshteinDistance === 2) {
        return { type: "mixed", description: "2 lettres différentes" };
    }
    return { type: "mixed", description: "Mot très proche" };
}

function diagnoseMixedProximity(
    levenshteinDistance: number,
    lenDiff: number,
): ProximityReason {
    const absDiff = Math.abs(lenDiff);

    if (levenshteinDistance <= 2 || absDiff >= levenshteinDistance) {
        const count = levenshteinDistance <= 2 ? absDiff : levenshteinDistance;
        if (lenDiff > 0) {
            return {
                type: "deletion",
                description: `${plural(count, "lettre manquante", "lettres manquantes")}`,
            };
        }
        return {
            type: "insertion",
            description: `${plural(count, "lettre en trop", "lettres en trop")}`,
        };
    }
    return { type: "mixed", description: "Mot très proche" };
}

export function diagnoseProximity(
    guess: string,
    target: string,
): ProximityReason {
    const levenshteinDistanceValue = levenshteinDistance(guess, target);
    const lenDiff = target.length - guess.length;

    // Same-length words: substitution, transposition, or mixed
    if (lenDiff === 0) {
        return diagnoseSameLengthWords(guess, target, levenshteinDistanceValue);
    }

    const absDiff = Math.abs(lenDiff);
    // Different-length words: deletion or insertion
    if (levenshteinDistanceValue <= 2 || absDiff >= levenshteinDistanceValue) {
        return diagnoseMixedProximity(levenshteinDistanceValue, lenDiff);
    }

    return { type: "mixed", description: "Mot très proche" };
}
