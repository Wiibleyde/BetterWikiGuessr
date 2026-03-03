import { normalizeWord } from "@/lib/game/normalize";
import type {
    GuessResult,
    MaskedArticle,
    MaskedSection,
    PunctuationToken,
    Token,
    WordPosition,
    WordToken,
} from "@/types/game";
import { ensureDailyWikiPage } from "./daily-wiki";

export type {
    Token,
    WordToken,
    PunctuationToken,
    MaskedSection,
    MaskedArticle,
    WordPosition,
    GuessResult,
};

const TOKEN_REGEX = /([\p{L}0-9]+)|(\n)|(\s+)|([^\s\p{L}0-9]+)/gu;

const REVEAL_THRESHOLD = 0.85;
const MIN_FUZZY_LENGTH = 4;
const MAX_LENGTH_RATIO = 1.5;

// ---------------------------------------------------------------------------
//  Metric 1 — Optimal String Alignment distance (restricted Damerau-Levenshtein)
//  Handles transpositions on top of insertions, deletions, substitutions.
// ---------------------------------------------------------------------------

function osaDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;

    const d: number[][] = Array.from({ length: m + 1 }, (_, i) => {
        const row = new Array<number>(n + 1);
        row[0] = i;
        return row;
    });
    for (let j = 0; j <= n; j++) d[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1, // deletion
                d[i][j - 1] + 1, // insertion
                d[i - 1][j - 1] + cost, // substitution
            );
            // transposition
            if (
                i > 1 &&
                j > 1 &&
                a[i - 1] === b[j - 2] &&
                a[i - 2] === b[j - 1]
            ) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }

    return d[m][n];
}

function osaSimilarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - osaDistance(a, b) / maxLen;
}

// ---------------------------------------------------------------------------
//  Metric 2 — Jaro-Winkler similarity
//  Prefix-weighted metric — great for catching words with a shared root.
// ---------------------------------------------------------------------------

function jaroSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const matchWindow = Math.max(
        0,
        Math.floor(Math.max(a.length, b.length) / 2) - 1,
    );

    const aMatches = new Array<boolean>(a.length).fill(false);
    const bMatches = new Array<boolean>(b.length).fill(false);

    let matches = 0;

    for (let i = 0; i < a.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, b.length);
        for (let j = start; j < end; j++) {
            if (bMatches[j] || a[i] !== b[j]) continue;
            aMatches[i] = true;
            bMatches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < a.length; i++) {
        if (!aMatches[i]) continue;
        while (!bMatches[k]) k++;
        if (a[i] !== b[k]) transpositions++;
        k++;
    }

    return (
        (matches / a.length +
            matches / b.length +
            (matches - transpositions / 2) / matches) /
        3
    );
}

function jaroWinklerSimilarity(a: string, b: string): number {
    const jaro = jaroSimilarity(a, b);

    // Common-prefix bonus (up to 4 characters)
    let prefix = 0;
    for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
        if (a[i] === b[i]) prefix++;
        else break;
    }

    return jaro + prefix * 0.1 * (1 - jaro);
}

// ---------------------------------------------------------------------------
//  Metric 3 — Bigram Dice coefficient
//  Structural similarity — resilient to reordering and scattered edits.
// ---------------------------------------------------------------------------

function bigramDiceCoefficient(a: string, b: string): number {
    if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;

    const aBigrams = new Map<string, number>();
    for (let i = 0; i < a.length - 1; i++) {
        const bg = a.substring(i, i + 2);
        aBigrams.set(bg, (aBigrams.get(bg) ?? 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bg = b.substring(i, i + 2);
        const count = aBigrams.get(bg) ?? 0;
        if (count > 0) {
            intersection++;
            aBigrams.set(bg, count - 1);
        }
    }

    return (2 * intersection) / (a.length - 1 + (b.length - 1));
}

// ---------------------------------------------------------------------------
//  Combined similarity — takes the best score across all three metrics so
//  that different kinds of proximity (typo, prefix, structural) are caught.
// ---------------------------------------------------------------------------

function wordSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;

    const osa = osaSimilarity(a, b);
    const jw = jaroWinklerSimilarity(a, b);
    const dice = bigramDiceCoefficient(a, b);

    return Math.max(osa, jw, dice);
}

interface InternalWord {
    normalized: string;
    display: string;
    index: number;
}

interface TokenizeResult {
    tokens: Token[];
    words: InternalWord[];
}

function tokenize(text: string, prefix = ""): TokenizeResult {
    const tokens: Token[] = [];
    const words: InternalWord[] = [];
    let wordIndex = 0;
    let tokenId = 0;

    const regex = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags);

    for (
        let match = regex.exec(text);
        match !== null;
        match = regex.exec(text)
    ) {
        if (match[1]) {
            tokens.push({
                type: "word",
                id: `${prefix}w${tokenId++}`,
                index: wordIndex,
                length: match[1].length,
            });
            words.push({
                normalized: normalizeWord(match[1]),
                display: match[1],
                index: wordIndex,
            });
            wordIndex++;
        } else {
            tokens.push({
                type: "punct",
                id: `${prefix}p${tokenId++}`,
                text: match[0],
            });
        }
    }

    return { tokens, words };
}

interface ArticleCache {
    maskedArticle: MaskedArticle;
    wordGroups: Map<string, WordPosition[]>;
    titleWords: InternalWord[];
    date: string;
}

let articleCache: ArticleCache | null = null;

interface WikiSection {
    title: string;
    content: string;
}

function buildArticleCache(
    title: string,
    sections: WikiSection[],
    date: string,
): ArticleCache {
    const { tokens: articleTitleTokens, words: titleWords } = tokenize(
        title,
        "at-",
    );
    let totalWords = titleWords.length;

    const maskedSections: MaskedSection[] = sections.map((section, i) => {
        const { tokens: titleTokens, words: stw } = tokenize(
            section.title,
            `s${i}t-`,
        );
        const { tokens: contentTokens, words: scw } = tokenize(
            section.content,
            `s${i}c-`,
        );
        totalWords += stw.length + scw.length;
        return { titleTokens, contentTokens };
    });

    const maskedArticle: MaskedArticle = {
        articleTitleTokens,
        sections: maskedSections,
        totalWords,
        date,
    };

    const wordGroups = new Map<string, WordPosition[]>();

    for (const w of titleWords) {
        const pos: WordPosition = {
            section: -1,
            part: "title",
            wordIndex: w.index,
            display: w.display,
        };
        const existing = wordGroups.get(w.normalized);
        if (existing) existing.push(pos);
        else wordGroups.set(w.normalized, [pos]);
    }

    for (let i = 0; i < sections.length; i++) {
        const { words: stw } = tokenize(sections[i].title, `s${i}t-`);
        for (const w of stw) {
            const pos: WordPosition = {
                section: i,
                part: "title",
                wordIndex: w.index,
                display: w.display,
            };
            const existing = wordGroups.get(w.normalized);
            if (existing) existing.push(pos);
            else wordGroups.set(w.normalized, [pos]);
        }

        const { words: scw } = tokenize(sections[i].content, `s${i}c-`);
        for (const w of scw) {
            const pos: WordPosition = {
                section: i,
                part: "content",
                wordIndex: w.index,
                display: w.display,
            };
            const existing = wordGroups.get(w.normalized);
            if (existing) existing.push(pos);
            else wordGroups.set(w.normalized, [pos]);
        }
    }

    return { maskedArticle, wordGroups, titleWords, date };
}

async function getArticleCache(): Promise<ArticleCache> {
    const page = await ensureDailyWikiPage();
    const dateKey = page.date.toISOString().split("T")[0];

    if (articleCache && articleCache.date === dateKey) {
        return articleCache;
    }

    const sections = page.sections as unknown as WikiSection[];
    articleCache = buildArticleCache(page.title, sections, dateKey);
    return articleCache;
}

export async function getMaskedArticle(): Promise<MaskedArticle> {
    const cache = await getArticleCache();
    return cache.maskedArticle;
}

/** Return the current server-side UTC date key (e.g. "2026-03-03"). */
export async function getCurrentServerDate(): Promise<string> {
    const cache = await getArticleCache();
    return cache.date;
}

export async function checkGuess(word: string): Promise<GuessResult> {
    const normalizedGuess = normalizeWord(word.trim());
    if (!normalizedGuess) {
        const cache = await getArticleCache();
        return {
            found: false,
            word: "",
            positions: [],
            occurrences: 0,
            similarity: 0,
            serverDate: cache.date,
        };
    }

    const cache = await getArticleCache();
    const { wordGroups } = cache;

    const exactPositions = wordGroups.get(normalizedGuess);
    if (exactPositions && exactPositions.length > 0) {
        return {
            found: true,
            word: normalizedGuess,
            positions: exactPositions,
            occurrences: exactPositions.length,
            similarity: 1,
            serverDate: cache.date,
        };
    }

    let bestSimilarity = 0;

    if (normalizedGuess.length >= MIN_FUZZY_LENGTH) {
        for (const [normalized] of wordGroups) {
            if (normalized.length < MIN_FUZZY_LENGTH) continue;

            // Proportional length filter — skip pairs with wildly different lengths
            const longer = Math.max(normalizedGuess.length, normalized.length);
            const shorter = Math.min(normalizedGuess.length, normalized.length);
            if (longer / shorter > MAX_LENGTH_RATIO) continue;

            const sim = wordSimilarity(normalizedGuess, normalized);

            if (sim > bestSimilarity) {
                bestSimilarity = sim;
            }
        }
    }

    // Fuzzy matches are never auto-revealed — only the similarity score is
    // returned so the frontend can display a "close" hint (orange state).
    return {
        found: false,
        word: normalizedGuess,
        positions: [],
        occurrences: 0,
        similarity: bestSimilarity,
        serverDate: cache.date,
    };
}

export async function getAllWordPositions(): Promise<WordPosition[]> {
    const cache = await getArticleCache();
    const allPositions: WordPosition[] = [];
    for (const positions of cache.wordGroups.values()) {
        for (const pos of positions) {
            allPositions.push(pos);
        }
    }
    return allPositions;
}

export async function verifyWin(guessedWords: string[]): Promise<boolean> {
    const cache = await getArticleCache();
    const normalizedGuesses = guessedWords.map(normalizeWord);

    return cache.titleWords.every((titleWord) => {
        for (const guess of normalizedGuesses) {
            if (guess === titleWord.normalized) return true;

            if (
                guess.length >= MIN_FUZZY_LENGTH &&
                titleWord.normalized.length >= MIN_FUZZY_LENGTH
            ) {
                const longer = Math.max(
                    guess.length,
                    titleWord.normalized.length,
                );
                const shorter = Math.min(
                    guess.length,
                    titleWord.normalized.length,
                );
                if (
                    longer / shorter <= MAX_LENGTH_RATIO &&
                    wordSimilarity(guess, titleWord.normalized) >=
                        REVEAL_THRESHOLD
                ) {
                    return true;
                }
            }
        }
        return false;
    });
}
