export { diagnoseProximity } from "./diagnose";

export function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;

    if (m === 0) return n;
    if (n === 0) return m;

    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    let curr = new Array<number>(n + 1);

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1, // suppression
                curr[j - 1] + 1, // insertion
                prev[j - 1] + cost, // substitution
            );
        }
        [prev, curr] = [curr, prev];
    }

    return prev[n];
}

export function levenshteinSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshteinDistance(a, b) / maxLen;
}
