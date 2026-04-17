import { STORAGE_KEY_PREFIX } from "@/constants/game";
import type { GameCache, RevealedMap, StoredGuess } from "@/types/game";

export function loadCache(date: string): GameCache | null {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${date}`);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as GameCache;
    } catch {
        return null;
    }
}

export function saveCache(
    date: string,
    guesses: StoredGuess[],
    revealed: RevealedMap,
    saved?: boolean,
    revealedImages?: string[],
): void {
    localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${date}`,
        JSON.stringify({ guesses, revealed, saved, revealedImages }),
    );
}

export function clearOldCaches(currentDate: string): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (
            key?.startsWith(STORAGE_KEY_PREFIX) &&
            key !== `${STORAGE_KEY_PREFIX}${currentDate}`
        ) {
            localStorage.removeItem(key);
        }
    }
}
