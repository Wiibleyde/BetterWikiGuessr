import { normalizeWord } from "@/lib/game/normalize";
import type {
    ArticleCache,
    GuessResult,
    InternalWord,
    MaskedArticle,
    MaskedSection,
    Token,
    TokenizeResult,
    WordPosition,
} from "@/types/game";
import type { WikiSection } from "@/types/wiki";
import {
    combinedSimilarity,
    diagnoseProximity,
    levenshteinDistance,
} from "@/utils/similarity";
import {
    CLOSE_THRESHOLD,
    MAX_LENGTH_RATIO,
    MIN_FUZZY_LENGTH,
    REVEAL_THRESHOLD,
    TOKEN_REGEX,
} from "../../constants/game";
import { ensureDailyWikiPage } from "./daily-wiki";

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

export const addToWordsGroup = (
    group: Map<string, WordPosition[]>,
    key: string,
    value: WordPosition,
) => {
    const existing = group.get(key);
    if (existing) existing.push(value);
    else group.set(key, [value]);
};

function indexWords(
    wordGroups: Map<string, WordPosition[]>,
    words: InternalWord[],
    section: number,
    part: "title" | "content",
): void {
    for (const w of words) {
        addToWordsGroup(wordGroups, w.normalized, {
            section,
            part,
            wordIndex: w.index,
            display: w.display,
        });
    }
}

let articleCache: ArticleCache | null = null;

function buildArticleCache(
    title: string,
    sections: WikiSection[],
    date: string,
): ArticleCache {
    const { tokens: articleTitleTokens, words: titleWords } = tokenize(
        title,
        "s0t-",
    );
    let totalWords = 0;

    const maskedSections: MaskedSection[] = sections.map((section, i) => {
        const { tokens: titleTokens, words: stw } =
            i === 0
                ? { tokens: articleTitleTokens, words: titleWords }
                : tokenize(section.title, `s${i}t-`);
        const { tokens: contentTokens, words: scw } = tokenize(
            section.content,
            `s${i}c-`,
        );
        totalWords += stw.length + scw.length;
        return { titleTokens, contentTokens };
    });

    const maskedArticle: MaskedArticle = {
        sections: maskedSections,
        totalWords,
        date,
        imageCount: 0, // Will be set by caller
    };

    const wordGroups = new Map<string, WordPosition[]>();

    // Article title words are now section 0's title
    indexWords(wordGroups, titleWords, 0, "title");

    for (let i = 0; i < sections.length; i++) {
        if (i > 0) {
            const { words: stw } = tokenize(sections[i].title, `s${i}t-`);
            indexWords(wordGroups, stw, i, "title");
        }
        const { words: scw } = tokenize(sections[i].content, `s${i}c-`);
        indexWords(wordGroups, scw, i, "content");
    }

    return { maskedArticle, wordGroups, titleWords, images: [], date };
}

async function getArticleCache(): Promise<ArticleCache> {
    const page = await ensureDailyWikiPage();
    const dateKey = page.date.toISOString().split("T")[0];

    if (articleCache && articleCache.date === dateKey) {
        return articleCache;
    }

    const sections = page.sections as unknown as WikiSection[];
    articleCache = buildArticleCache(page.title, sections, dateKey);
    articleCache.images = page.images;
    articleCache.maskedArticle.imageCount = page.images.length;
    return articleCache;
}

export async function getMaskedArticle(): Promise<MaskedArticle> {
    const cache = await getArticleCache();
    return cache.maskedArticle;
}

export async function checkGuess(
    word: string,
    revealedWords?: string[],
): Promise<GuessResult> {
    const normalizedGuess = normalizeWord(word.trim());
    const cache = await getArticleCache();

    if (!normalizedGuess) {
        return {
            found: false,
            word: "",
            positions: [],
            occurrences: 0,
            similarity: 0,
            serverDate: cache.date,
        };
    }

    const { wordGroups } = cache;
    const revealedSet = revealedWords ? new Set(revealedWords) : null;

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
    let bestMatchWord = "";

    // Phase 1 — Auto-reveal: if the guess is at OSA distance ≤ 1 from an
    // article word, treat it as found (handles plurals, single-char typos, etc.)
    let autoRevealPositions: WordPosition[] | null = null;
    let autoRevealOccurrences = 0;

    if (normalizedGuess.length >= MIN_FUZZY_LENGTH) {
        for (const [normalized, positions] of wordGroups) {
            if (normalized.length < MIN_FUZZY_LENGTH) continue;

            // Skip words already discovered by the player
            if (revealedSet?.has(normalized)) continue;

            // Proportional length filter — skip pairs with wildly different lengths
            const longer = Math.max(normalizedGuess.length, normalized.length);
            const shorter = Math.min(normalizedGuess.length, normalized.length);
            if (longer / shorter > MAX_LENGTH_RATIO) continue;

            const dist = levenshteinDistance(normalizedGuess, normalized);

            // Auto-reveal at distance 1
            if (dist === 1 && positions.length > autoRevealOccurrences) {
                autoRevealPositions = positions;
                autoRevealOccurrences = positions.length;
                bestMatchWord = normalized;
            }

            const sim = combinedSimilarity(normalizedGuess, normalized);
            if (sim > bestSimilarity) {
                bestSimilarity = sim;
                if (dist !== 1) {
                    bestMatchWord = normalized;
                }
            }
        }
    }

    // If we found a word at distance 1, auto-reveal it
    if (autoRevealPositions) {
        return {
            found: true,
            word: bestMatchWord,
            positions: autoRevealPositions,
            occurrences: autoRevealOccurrences,
            similarity: 1,
            serverDate: cache.date,
        };
    }

    // Build proximity diagnosis for close matches
    const proximityReason =
        bestSimilarity >= CLOSE_THRESHOLD && bestMatchWord
            ? diagnoseProximity(normalizedGuess, bestMatchWord)
            : undefined;

    return {
        found: false,
        word: normalizedGuess,
        positions: [],
        occurrences: 0,
        similarity: bestSimilarity,
        serverDate: cache.date,
        proximityReason,
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

export async function getHintImage(hintIndex: number): Promise<{
    imageUrl: string;
    hintIndex: number;
    totalImages: number;
} | null> {
    const cache = await getArticleCache();
    if (hintIndex < 0 || hintIndex >= cache.images.length) return null;
    return {
        imageUrl: cache.images[hintIndex],
        hintIndex,
        totalImages: cache.images.length,
    };
}

export async function getImageCount(): Promise<number> {
    const cache = await getArticleCache();
    return cache.images.length;
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
                    combinedSimilarity(guess, titleWord.normalized) >=
                        REVEAL_THRESHOLD
                ) {
                    return true;
                }
            }
        }
        return false;
    });
}
