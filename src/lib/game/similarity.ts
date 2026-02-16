import { normalizeWord } from "@/lib/game/normalize";

/**
 * Damerau-Levenshtein distance with transpositions.
 * Allows insertion, deletion, substitution, and transposition of adjacent characters.
 */
export function damerauLevenshteinDistance(a: string, b: string): number {
    const len1 = a.length;
    const len2 = b.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    const H: number[][] = [];
    const maxdist = len1 + len2;
    H[-1] = Array(len2 + 2).fill(maxdist);
    H[-1][-1] = maxdist;

    for (let i = 0; i <= len1; i++) {
        H[i] = Array(len2 + 2).fill(0);
        H[i][-1] = maxdist;
        H[i][0] = i;
    }

    for (let j = 0; j <= len2; j++) {
        H[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            H[i][j] = Math.min(
                H[i - 1][j] + 1, // deletion
                H[i][j - 1] + 1, // insertion
                H[i - 1][j - 1] + cost, // substitution
            );

            // transposition
            if (
                i > 1 &&
                j > 1 &&
                a[i - 1] === b[j - 2] &&
                a[i - 2] === b[j - 1]
            ) {
                H[i][j] = Math.min(H[i][j], H[i - 2][j - 2] + cost);
            }
        }
    }

    return H[len1][len2];
}

/**
 * Weighted Levenshtein distance with costs based on keyboard proximity and phonetic similarity.
 */
export function weightedLevenshteinDistance(a: string, b: string): number {
    const len1 = a.length;
    const len2 = b.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // Create distance matrix
    const matrix: number[][] = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));

    // Initialize first column and row
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Calculate distances with weighted costs
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (a[i - 1] === b[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                const substitutionCost = getSubstitutionCost(
                    a[i - 1],
                    b[j - 1],
                );
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1, // deletion
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j - 1] + substitutionCost, // substitution
                );
            }
        }
    }

    return matrix[len1][len2];
}

/**
 * Returns a weighted cost for character substitution based on:
 * - Keyboard proximity (AZERTY layout)
 * - Phonetic similarity (French)
 */
function getSubstitutionCost(a: string, b: string): number {
    // Phonetically similar characters get lower cost
    const phoneticGroups = [
        ["s", "c", "z"], // sibilants
        ["b", "p"], // bilabial stops
        ["d", "t"], // alveolar stops
        ["g", "k", "q"], // velar stops
        ["v", "f"], // labiodental fricatives
        ["e", "a"], // open vowels
        ["i", "y"], // close front vowels
        ["o", "u"], // back vowels
        ["m", "n"], // nasals
    ];

    for (const group of phoneticGroups) {
        if (group.includes(a) && group.includes(b)) {
            return 0.5; // Lower cost for phonetically similar
        }
    }

    // Keyboard proximity (AZERTY layout)
    const keyboardNeighbors: Record<string, string[]> = {
        a: ["z", "q", "s"],
        z: ["a", "e", "s", "q"],
        e: ["z", "r", "d", "s"],
        r: ["e", "t", "f", "d"],
        t: ["r", "y", "g", "f"],
        y: ["t", "u", "h", "g"],
        u: ["y", "i", "j", "h"],
        i: ["u", "o", "k", "j"],
        o: ["i", "p", "l", "k"],
        p: ["o", "m", "l"],
        q: ["a", "s", "w", "z"],
        s: ["q", "d", "z", "a", "w", "e"],
        d: ["s", "f", "e", "r"],
        f: ["d", "g", "r", "t"],
        g: ["f", "h", "t", "y"],
        h: ["g", "j", "y", "u"],
        j: ["h", "k", "u", "i"],
        k: ["j", "l", "i", "o"],
        l: ["k", "m", "o", "p"],
        m: ["l", "p"],
        w: ["q", "s", "x"],
        x: ["w", "c"],
        c: ["x", "v"],
        v: ["c", "b"],
        b: ["v", "n"],
        n: ["b"],
    };

    const neighborsA = keyboardNeighbors[a] || [];
    if (neighborsA.includes(b)) {
        return 0.7; // Lower cost for keyboard neighbors
    }

    return 1.0; // Standard cost
}

/**
 * N-gram similarity (bigram-based by default).
 * Returns a value between 0 and 1.
 */
export function ngramSimilarity(a: string, b: string, n = 2): number {
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // Add padding
    const paddedA = `${"_".repeat(n - 1)}${a}${"_".repeat(n - 1)}`;
    const paddedB = `${"_".repeat(n - 1)}${b}${"_".repeat(n - 1)}`;

    // Extract n-grams
    const ngramsA = new Set<string>();
    for (let i = 0; i <= paddedA.length - n; i++) {
        ngramsA.add(paddedA.substring(i, i + n));
    }

    const ngramsB = new Set<string>();
    for (let i = 0; i <= paddedB.length - n; i++) {
        ngramsB.add(paddedB.substring(i, i + n));
    }

    // Calculate Jaccard similarity
    const intersection = new Set([...ngramsA].filter((x) => ngramsB.has(x)));
    const union = new Set([...ngramsA, ...ngramsB]);

    return intersection.size / union.size;
}

/**
 * Combined similarity score using multiple metrics.
 * Returns a value between 0 and 1.
 */
export function combinedSimilarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;

    // Damerau-Levenshtein similarity (handles transpositions)
    const dlDist = damerauLevenshteinDistance(a, b);
    const dlSim = 1 - dlDist / maxLen;

    // Weighted Levenshtein similarity (phonetic + keyboard)
    const wlDist = weightedLevenshteinDistance(a, b);
    const wlSim = 1 - wlDist / maxLen;

    // N-gram similarity (bigrams)
    const ngSim = ngramSimilarity(a, b, 2);

    // Weighted combination
    // DL is excellent for typos and transpositions (45%)
    // WL is good for phonetic errors (30%)
    // N-gram is good for partial matches (25%)
    return dlSim * 0.45 + wlSim * 0.3 + ngSim * 0.25;
}

/**
 * French lemmatization patterns for common word variations.
 * Returns possible lemmas/root forms of a word.
 */
export function getLemmas(word: string): string[] {
    const normalized = normalizeWord(word);
    const lemmas = [normalized];

    // Plural to singular (very common French patterns)
    if (normalized.endsWith("aux")) {
        // -aux → -al (ex: animaux → animal)
        lemmas.push(`${normalized.slice(0, -3)}al`);
    } else if (normalized.endsWith("s") && !normalized.endsWith("ss")) {
        // -s → remove (ex: chats → chat)
        lemmas.push(normalized.slice(0, -1));
    } else if (normalized.endsWith("x")) {
        // -x → remove (ex: chevaux → chevau, but we handle -aux above)
        lemmas.push(normalized.slice(0, -1));
    }

    // Feminine to masculine
    if (normalized.endsWith("ee")) {
        // -ée → -é (ex: passée → passé)
        lemmas.push(`${normalized.slice(0, -2)}e`);
    } else if (normalized.endsWith("e") && normalized.length > 2) {
        // -e → remove (ex: grande → grand)
        lemmas.push(normalized.slice(0, -1));
    }

    // Common verb endings to infinitive (rough heuristics)
    if (normalized.endsWith("ent")) {
        // -ent → -er (3rd person plural → infinitive, ex: parlent → parler)
        lemmas.push(`${normalized.slice(0, -3)}er`);
    } else if (normalized.endsWith("ait") || normalized.endsWith("aient")) {
        // imperfect → infinitive
        const stem = normalized.endsWith("ait")
            ? normalized.slice(0, -3)
            : normalized.slice(0, -5);
        lemmas.push(`${stem}er`);
    } else if (normalized.endsWith("ant")) {
        // present participle → infinitive (ex: parlant → parler)
        lemmas.push(`${normalized.slice(0, -3)}er`);
    }

    // Diminutives and augmentatives
    if (normalized.endsWith("ette")) {
        lemmas.push(normalized.slice(0, -4)); // fillette → fill (incomplete but helps)
    }

    return [...new Set(lemmas)]; // Remove duplicates
}

/**
 * Check if two words might be morphological variants of each other.
 */
export function areMorphologicalVariants(
    word1: string,
    word2: string,
): boolean {
    const lemmas1 = getLemmas(word1);
    const lemmas2 = getLemmas(word2);

    // Check if any lemma matches
    for (const l1 of lemmas1) {
        for (const l2 of lemmas2) {
            if (l1 === l2) return true;
        }
    }

    return false;
}

/**
 * Common French synonyms and related words.
 * Limited set for performance - can be extended.
 */
const SEMANTIC_GROUPS: Record<string, string[]> = {
    // Numbers
    un: ["une", "premier", "premiere"],
    deux: ["deuxieme", "second", "seconde"],
    trois: ["troisieme"],

    // Common words
    grand: ["grande", "gros", "grosse", "enorme", "vaste", "immense"],
    petit: ["petite", "peu", "minuscule"],
    bon: ["bonne", "bien", "meilleur", "meilleure"],
    mauvais: ["mauvaise", "mal"],
    homme: ["humain", "personne", "individu", "garcon"],
    femme: ["dame", "personne", "fille"],
    ville: ["cite", "commune", "metropole", "urbain"],
    pays: ["nation", "etat", "territoire"],
    roi: ["monarque", "souverain"],
    guerre: ["conflit", "combat", "bataille"],
    paix: ["armistice", "treve"],

    // Time
    jour: ["journee"],
    an: ["annee", "ans"],
    siecle: ["centenaire"],

    // Directions
    nord: ["septentrional"],
    sud: ["meridional"],
    est: ["oriental"],
    ouest: ["occidental"],
};

/**
 * Check if two words are semantically related.
 */
export function areSemanticallySimilar(word1: string, word2: string): boolean {
    const norm1 = normalizeWord(word1);
    const norm2 = normalizeWord(word2);

    if (norm1 === norm2) return true;

    // Check if they're in the same semantic group
    for (const [key, variants] of Object.entries(SEMANTIC_GROUPS)) {
        const group = [key, ...variants];
        if (group.includes(norm1) && group.includes(norm2)) {
            return true;
        }
    }

    return false;
}
