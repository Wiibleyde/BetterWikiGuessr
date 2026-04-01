import { levenshteinSimilarity } from "./levenstein";

export { diagnoseProximity } from "./diagnose";
export { levenshteinDistance, levenshteinSimilarity } from "./levenstein";

/**
 * Combined similarity — returns the best score across Levenshtein and
 *   - Levenshtein  → typos, insertions, deletions
 */
export function combinedSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    return levenshteinSimilarity(a, b);
}
