import type {
    ArticleCache,
    GuessResult,
    MaskedArticle,
    WordPosition,
} from "@/types/game";
import type { WikiSection } from "@/types/wiki";
import {
    buildArticleCache,
    checkGuessAgainstCache,
    verifyWinAgainstCache,
} from "./game";

interface CachedEntry {
    cache: ArticleCache;
    lastAccess: number;
}

const coopCacheMap = new Map<string, CachedEntry>();

export function getOrBuildCoopCache(
    lobbyCode: string,
    title: string,
    sections: WikiSection[],
    date: string,
): ArticleCache {
    const existing = coopCacheMap.get(lobbyCode);
    if (existing) {
        existing.lastAccess = Date.now();
        return existing.cache;
    }

    const cache = buildArticleCache(title, sections, date);
    coopCacheMap.set(lobbyCode, { cache, lastAccess: Date.now() });
    return cache;
}

export function getCoopCache(lobbyCode: string): ArticleCache | null {
    const entry = coopCacheMap.get(lobbyCode);
    if (!entry) return null;
    entry.lastAccess = Date.now();
    return entry.cache;
}

export function getCoopMaskedArticle(lobbyCode: string): MaskedArticle | null {
    const cache = getCoopCache(lobbyCode);
    return cache?.maskedArticle ?? null;
}

export function checkCoopGuess(
    lobbyCode: string,
    word: string,
    revealedWords?: string[],
): GuessResult | null {
    const cache = getCoopCache(lobbyCode);
    if (!cache) return null;
    return checkGuessAgainstCache(cache, word, revealedWords);
}

export function verifyCoopWin(
    lobbyCode: string,
    guessedWords: string[],
): boolean {
    const cache = getCoopCache(lobbyCode);
    if (!cache) return false;
    return verifyWinAgainstCache(cache, guessedWords);
}

export function getAllCoopWordPositions(lobbyCode: string): WordPosition[] {
    const cache = getCoopCache(lobbyCode);
    if (!cache) return [];

    const allPositions: WordPosition[] = [];
    for (const positions of cache.wordGroups.values()) {
        for (const position of positions) {
            allPositions.push(position);
        }
    }

    return allPositions;
}

export function removeCoopCache(lobbyCode: string): void {
    coopCacheMap.delete(lobbyCode);
}

export function cleanupCoopCaches(maxAgeMs = 7_200_000): void {
    const now = Date.now();
    for (const [code, entry] of coopCacheMap) {
        if (now - entry.lastAccess > maxAgeMs) {
            coopCacheMap.delete(code);
        }
    }
}
