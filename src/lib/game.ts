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

function normalizeWord(word: string): string {
    return word
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

const TOKEN_REGEX = /([a-zA-ZÀ-ÿ0-9]+)|(\n)|(\s+)|([^\sa-zA-ZÀ-ÿ0-9]+)/g;

const REVEAL_THRESHOLD = 0.8;
const MIN_FUZZY_LENGTH = 4;

function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
        Array(n + 1).fill(0),
    );
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            );
        }
    }
    return dp[m][n];
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

interface CollectedWord {
    normalized: string;
    display: string;
    section: number;
    part: "title" | "content";
    wordIndex: number;
}

function collectAllWords(
    title: string,
    sections: { title: string; content: string }[],
): CollectedWord[] {
    const result: CollectedWord[] = [];

    const { words: titleWords } = tokenize(title);
    for (const w of titleWords) {
        result.push({
            normalized: w.normalized,
            display: w.display,
            section: -1,
            part: "title",
            wordIndex: w.index,
        });
    }

    for (let i = 0; i < sections.length; i++) {
        const { words: stw } = tokenize(sections[i].title);
        for (const w of stw) {
            result.push({
                normalized: w.normalized,
                display: w.display,
                section: i,
                part: "title",
                wordIndex: w.index,
            });
        }

        const { words: scw } = tokenize(sections[i].content);
        for (const w of scw) {
            result.push({
                normalized: w.normalized,
                display: w.display,
                section: i,
                part: "content",
                wordIndex: w.index,
            });
        }
    }

    return result;
}

export async function getMaskedArticle(): Promise<MaskedArticle> {
    const page = await ensureDailyWikiPage();
    const sections = page.sections as { title: string; content: string }[];

    const { tokens: articleTitleTokens, words: titleWords } = tokenize(
        page.title,
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

    return {
        articleTitleTokens,
        sections: maskedSections,
        totalWords,
        date: page.date.toISOString().split("T")[0],
    };
}

export async function checkGuess(word: string): Promise<GuessResult> {
    const page = await ensureDailyWikiPage();
    const sections = page.sections as { title: string; content: string }[];

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

    const allWords = collectAllWords(page.title, sections);

    // Group by normalized form
    const wordGroups = new Map<string, WordPosition[]>();
    for (const w of allWords) {
        const existing = wordGroups.get(w.normalized);
        const pos: WordPosition = {
            section: w.section,
            part: w.part,
            wordIndex: w.wordIndex,
            display: w.display,
        };
        if (existing) {
            existing.push(pos);
        } else {
            wordGroups.set(w.normalized, [pos]);
        }
    }

    // Exact match
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

    // Fuzzy matching (only for words >= MIN_FUZZY_LENGTH)
    let bestSimilarity = 0;
    const fuzzyPositions: WordPosition[] = [];

    if (normalizedGuess.length >= MIN_FUZZY_LENGTH) {
        for (const [normalized, positions] of wordGroups) {
            if (normalized.length < MIN_FUZZY_LENGTH) continue;

            const sim = wordSimilarity(normalizedGuess, normalized);

            if (sim > bestSimilarity) {
                bestSimilarity = sim;
            }

            // Reveal if high similarity AND first character matches
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
