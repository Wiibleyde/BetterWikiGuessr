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

const TOKEN_REGEX = /([a-zA-ZÀ-ÿ0-9]+)|(\n)|(\s+)|([^\sa-zA-ZÀ-ÿ0-9]+)/g;

const REVEAL_THRESHOLD = 0.8;
const MIN_FUZZY_LENGTH = 4;

/**
 * Two-row Levenshtein distance — O(min(m,n)) space instead of O(m*n).
 */
function levenshteinDistance(a: string, b: string): number {
    if (a.length < b.length) {
        const tmp = a;
        a = b;
        b = tmp;
    }

    const m = a.length;
    const n = b.length;

    let prev = new Array<number>(n + 1);
    let curr = new Array<number>(n + 1);

    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,
                curr[j - 1] + 1,
                prev[j - 1] + cost,
            );
        }
        const swap = prev;
        prev = curr;
        curr = swap;
    }

    return prev[n];
}

function wordSimilarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshteinDistance(a, b) / maxLen;
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

export async function checkGuess(word: string): Promise<GuessResult> {
    const normalizedGuess = normalizeWord(word.trim());
    if (!normalizedGuess) {
        return {
            found: false,
            word: "",
            positions: [],
            occurrences: 0,
            similarity: 0,
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
        };
    }

    let bestSimilarity = 0;
    const fuzzyPositions: WordPosition[] = [];

    if (normalizedGuess.length >= MIN_FUZZY_LENGTH) {
        for (const [normalized, positions] of wordGroups) {
            if (normalized.length < MIN_FUZZY_LENGTH) continue;

            const sim = wordSimilarity(normalizedGuess, normalized);

            if (sim > bestSimilarity) {
                bestSimilarity = sim;
            }

            if (
                sim >= REVEAL_THRESHOLD &&
                normalizedGuess[0] === normalized[0]
            ) {
                fuzzyPositions.push(...positions);
            }
        }
    }

    if (fuzzyPositions.length > 0) {
        return {
            found: true,
            word: normalizedGuess,
            positions: fuzzyPositions,
            occurrences: fuzzyPositions.length,
            similarity: bestSimilarity,
        };
    }

    return {
        found: false,
        word: normalizedGuess,
        positions: [],
        occurrences: 0,
        similarity: bestSimilarity,
    };
}

export async function verifyWin(guessedWords: string[]): Promise<boolean> {
    const cache = await getArticleCache();
    const normalizedGuesses = new Set(guessedWords.map(normalizeWord));

    return cache.titleWords.every((w) => normalizedGuesses.has(w.normalized));
}
