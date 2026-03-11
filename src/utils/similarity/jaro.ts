// ---------------------------------------------------------------------------
//  Jaro & Jaro-Winkler similarity
//
//  Jaro handles transpositions and character matches within a sliding window.
//  Jaro-Winkler boosts the score when two strings share a common prefix,
//  which makes it ideal for French vocabulary families (e.g. "nation",
//  "national", "nationalisme") and for catching keyboard transpositions in
//  longer words that Levenshtein may under-score.
// ---------------------------------------------------------------------------

/**
 * Jaro similarity between two normalized strings.
 * Returns a score in [0, 1]: 0 = completely different, 1 = identical.
 */
export function jaroSimilarity(a: string, b: string): number {
    if (a === b) return 1;

    const lenA = a.length;
    const lenB = b.length;

    if (lenA === 0 || lenB === 0) return 0;

    // Maximum distance within which characters are considered matching
    const matchDistance = Math.max(Math.floor(Math.max(lenA, lenB) / 2) - 1, 0);

    const matchesA = new Array<boolean>(lenA).fill(false);
    const matchesB = new Array<boolean>(lenB).fill(false);
    let matches = 0;

    for (let i = 0; i < lenA; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, lenB);

        for (let j = start; j < end; j++) {
            if (matchesB[j] || a[i] !== b[j]) continue;
            matchesA[i] = true;
            matchesB[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0;

    // Count transpositions (matched chars in wrong order)
    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < lenA; i++) {
        if (!matchesA[i]) continue;
        while (!matchesB[k]) k++;
        if (a[i] !== b[k]) transpositions++;
        k++;
    }

    return (
        matches / lenA +
        matches / lenB +
        (matches - transpositions / 2) / matches
    ) / 3;
}

/**
 * Jaro-Winkler similarity between two normalized strings.
 * Adds a prefix bonus (up to 4 chars, scaled by p=0.1) on top of Jaro.
 * Returns a score in [0, 1].
 */
export function jaroWinklerSimilarity(a: string, b: string, p = 0.1): number {
    const jaro = jaroSimilarity(a, b);

    // Common prefix length, capped at 4 characters
    let prefix = 0;
    const maxPrefix = Math.min(4, Math.min(a.length, b.length));
    for (let i = 0; i < maxPrefix; i++) {
        if (a[i] === b[i]) prefix++;
        else break;
    }

    return jaro + prefix * p * (1 - jaro);
}
