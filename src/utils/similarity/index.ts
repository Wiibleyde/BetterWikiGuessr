import { jaroWinklerSimilarity } from "./jaro";
import { levenshteinSimilarity } from "./levenstein";

export { diagnoseProximity } from "./diagnose";
export { jaroSimilarity, jaroWinklerSimilarity } from "./jaro";
export { levenshteinDistance, levenshteinSimilarity } from "./levenstein";

/**
 * Combined similarity — returns the best score across Levenshtein and
 * Jaro-Winkler so that different kinds of proximity are caught:
 *   - Levenshtein  → typos, insertions, deletions
 *   - Jaro-Winkler → transpositions, shared prefix (word families)
 */
export function combinedSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    return Math.max(levenshteinSimilarity(a, b), jaroWinklerSimilarity(a, b));
}
