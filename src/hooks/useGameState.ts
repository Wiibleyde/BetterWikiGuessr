"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeWord } from "@/lib/game/normalize";
import type {
    GameCache,
    GuessResult,
    MaskedArticle,
    RevealedMap,
    StoredGuess,
    WordPosition,
    WordToken,
} from "@/types/game";
import { HINT_PENALTY } from "@/types/game";

const STORAGE_KEY_PREFIX = "wikiguessr-";
const DATE_CHECK_INTERVAL_MS = 60_000;

export function posKey(
    section: number,
    part: string,
    wordIndex: number,
): string {
    return `${section}:${part}:${wordIndex}`;
}

function checkWinCondition(
    article: MaskedArticle,
    revealed: RevealedMap,
): boolean {
    const titleWords = article.articleTitleTokens.filter(
        (t): t is WordToken => t.type === "word",
    );
    return (
        titleWords.length > 0 &&
        titleWords.every(
            (t) => revealed[posKey(-1, "title", t.index)] !== undefined,
        )
    );
}

function loadCache(date: string): GameCache | null {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${date}`);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as GameCache;
    } catch {
        return null;
    }
}

function saveCache(
    date: string,
    guesses: StoredGuess[],
    revealed: RevealedMap,
    saved?: boolean,
    revealedImages?: string[],
) {
    localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${date}`,
        JSON.stringify({ guesses, revealed, saved, revealedImages }),
    );
}

function clearOldCaches(currentDate: string) {
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

/** Push current game state to the server (fire-and-forget). */
async function pushStateToServer(cache: GameCache): Promise<boolean> {
    try {
        const res = await fetch("/api/game/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cache),
        });
        return res.ok;
    } catch {
        console.error("[sync] failed to push state to server");
        return false;
    }
}

/** Fetch the saved game state from the server. */
async function fetchStateFromServer(): Promise<GameCache | null> {
    try {
        const res = await fetch("/api/game/state");
        if (!res.ok) return null;
        const data = (await res.json()) as { state: GameCache | null };
        return data.state;
    } catch {
        console.error("[sync] failed to fetch state from server");
        return null;
    }
}

export function useGameState() {
    const [article, setArticle] = useState<MaskedArticle | null>(null);
    const [guesses, setGuesses] = useState<StoredGuess[]>([]);
    const [revealed, setRevealed] = useState<RevealedMap>({});
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [guessing, setGuessing] = useState(false);
    const [won, setWon] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastGuessFound, setLastGuessFound] = useState<boolean | null>(null);
    const [lastGuessSimilarity, setLastGuessSimilarity] = useState<number>(0);
    const [lastRevealedWord, setLastRevealedWord] = useState<string | null>(
        null,
    );
    const [synced, setSynced] = useState(false);
    const [revealedImages, setRevealedImages] = useState<string[]>([]);
    const [revealingHint, setRevealingHint] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dateCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(
        null,
    );

    const revealedCount = Object.keys(revealed).length;
    const totalWords = article?.totalWords ?? 0;
    const percentage =
        totalWords > 0 ? Math.round((revealedCount / totalWords) * 100) : 0;
    const hintsUsed = revealedImages.length;
    const imageCount = article?.imageCount ?? 0;
    const score = guesses.length + hintsUsed * HINT_PENALTY;

    /** Fetch all images for the article (used after winning). */
    const revealAllImages = useCallback(async (art: MaskedArticle) => {
        const total = art.imageCount ?? 0;
        if (total === 0) return;
        const allImages: string[] = [];
        for (let i = 0; i < total; i++) {
            try {
                const res = await fetch("/api/game/hint", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ hintIndex: i }),
                });
                if (!res.ok) continue;
                const data = (await res.json()) as {
                    imageUrl: string;
                };
                allImages.push(data.imageUrl);
            } catch {
                // skip failed image
            }
        }
        setRevealedImages(allImages);
    }, []);

    /** Fetch all word positions from the server and reveal every word. */
    const revealAllWords = useCallback(
        async (
            art: MaskedArticle,
            words: string[],
            currentGuesses: StoredGuess[],
            currentRevealed: RevealedMap,
        ) => {
            try {
                const res = await fetch("/api/game/reveal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ words }),
                });
                if (!res.ok) return;
                const data = (await res.json()) as {
                    positions: WordPosition[];
                };
                const fullRevealed = { ...currentRevealed };
                for (const pos of data.positions) {
                    fullRevealed[posKey(pos.section, pos.part, pos.wordIndex)] =
                        pos.display;
                }
                setRevealed(fullRevealed);
                saveCache(art.date, currentGuesses, fullRevealed);
            } catch {
                console.error("[reveal] failed to reveal all words");
            }
        },
        [],
    );

    /** Reload the article from the server (used on day change). */
    const reloadArticle = useCallback(() => {
        setLoading(true);
        setGuesses([]);
        setRevealed({});
        setWon(false);
        setSaved(false);
        setSynced(false);
        setError(null);
        setInput("");
        setRevealedImages([]);

        fetch("/api/game")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur serveur");
                return res.json();
            })
            .then((data: MaskedArticle) => {
                setArticle(data);
                clearOldCaches(data.date);

                const cache = loadCache(data.date);
                if (cache) {
                    setGuesses(cache.guesses ?? []);
                    setRevealed(cache.revealed ?? {});
                    setRevealedImages(cache.revealedImages ?? []);
                    if (cache.saved) {
                        setSaved(true);
                    }
                    if (checkWinCondition(data, cache.revealed ?? {})) {
                        setWon(true);
                        const words = (cache.guesses ?? []).map((g) => g.word);
                        revealAllWords(
                            data,
                            words,
                            cache.guesses ?? [],
                            cache.revealed ?? {},
                        );
                        revealAllImages(data);
                    }
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Impossible de charger l'article du jour");
                setLoading(false);
            });
    }, [revealAllWords, revealAllImages]);

    /** Check the server date and reload if the day has changed. */
    const checkServerDate = useCallback(async () => {
        if (!article) return;
        try {
            const res = await fetch("/api/game/date");
            if (!res.ok) return;
            const data = (await res.json()) as { date: string };
            if (data.date !== article.date) {
                reloadArticle();
            }
        } catch {
            // Silently ignore — will retry on next interval
        }
    }, [article, reloadArticle]);

    // Periodically check if the server day has changed
    useEffect(() => {
        if (!article) return;

        dateCheckTimerRef.current = setInterval(() => {
            checkServerDate();
        }, DATE_CHECK_INTERVAL_MS);

        return () => {
            if (dateCheckTimerRef.current) {
                clearInterval(dateCheckTimerRef.current);
                dateCheckTimerRef.current = null;
            }
        };
    }, [article, checkServerDate]);

    useEffect(() => {
        fetch("/api/game")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur serveur");
                return res.json();
            })
            .then((data: MaskedArticle) => {
                setArticle(data);
                clearOldCaches(data.date);

                const cache = loadCache(data.date);
                if (cache) {
                    setGuesses(cache.guesses ?? []);
                    setRevealed(cache.revealed ?? {});
                    setRevealedImages(cache.revealedImages ?? []);
                    if (cache.saved) {
                        setSaved(true);
                    }
                    if (checkWinCondition(data, cache.revealed ?? {})) {
                        setWon(true);
                        const words = (cache.guesses ?? []).map((g) => g.word);
                        revealAllWords(
                            data,
                            words,
                            cache.guesses ?? [],
                            cache.revealed ?? {},
                        );
                        revealAllImages(data);
                    }
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Impossible de charger l'article du jour");
                setLoading(false);
            });
    }, [revealAllWords, revealAllImages]);

    /**
     * Synchronize state with the database after login.
     * - If DB has state → replace localStorage & React state with DB values.
     * - If DB is empty but localStorage has data → push localStorage to DB.
     * - If both empty → do nothing.
     */
    const syncWithDatabase = useCallback(async () => {
        if (!article || synced) return;

        const dbState = await fetchStateFromServer();
        const localCache = loadCache(article.date);

        const dbCount = dbState?.guesses?.length ?? 0;
        const localCount = localCache?.guesses?.length ?? 0;

        if (dbState && dbCount > 0 && dbCount >= localCount) {
            // DB has equal or more progress — use it
            setGuesses(dbState.guesses);
            setRevealed(dbState.revealed);
            setRevealedImages(dbState.revealedImages ?? []);
            if (dbState.saved) {
                setSaved(true);
            }
            const isWon = checkWinCondition(article, dbState.revealed);
            if (isWon) {
                setWon(true);
                const words = dbState.guesses.map((g) => g.word);
                revealAllWords(
                    article,
                    words,
                    dbState.guesses,
                    dbState.revealed,
                );
                revealAllImages(article);
            }
            saveCache(
                article.date,
                dbState.guesses,
                dbState.revealed,
                dbState.saved,
                dbState.revealedImages,
            );
        } else if (localCache && localCount > 0) {
            // Local has more progress — push it to DB
            await pushStateToServer(localCache);
        }

        setSynced(true);
    }, [article, synced, revealAllWords, revealAllImages]);

    /** Push current state to the DB (called on each guess when logged in). */
    const syncToDatabase = useCallback(async () => {
        if (!article) return;
        const cache: GameCache = { guesses, revealed, saved, revealedImages };
        await pushStateToServer(cache);
    }, [article, guesses, revealed, saved, revealedImages]);

    // Cleanup date-check interval on unmount
    useEffect(() => {
        return () => {
            if (dateCheckTimerRef.current) {
                clearInterval(dateCheckTimerRef.current);
            }
        };
    }, []);

    const submitGuess = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            if (!input.trim() || !article || guessing || won) return;

            const raw = input.trim();
            const normalized = normalizeWord(raw);

            if (guesses.some((g) => g.word === normalized)) {
                setInput("");
                return;
            }

            setGuessing(true);
            setLastGuessFound(null);
            setLastGuessSimilarity(0);
            setLastRevealedWord(null);

            try {
                const res = await fetch("/api/game/guess", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ word: raw }),
                });

                if (!res.ok) throw new Error("Erreur serveur");

                const result: GuessResult = await res.json();

                // Detect server day change — discard this guess & reload
                if (result.serverDate !== article.date) {
                    reloadArticle();
                    return;
                }

                const newGuess: StoredGuess = {
                    word: result.word,
                    found: result.found,
                    occurrences: result.occurrences,
                    similarity: result.similarity,
                };

                const newGuesses = [newGuess, ...guesses];
                const newRevealed = { ...revealed };
                for (const pos of result.positions) {
                    newRevealed[posKey(pos.section, pos.part, pos.wordIndex)] =
                        pos.display;
                }

                setGuesses(newGuesses);
                setRevealed(newRevealed);
                setLastGuessFound(result.found);
                setLastGuessSimilarity(result.similarity);

                if (result.found && result.similarity === 1) {
                    setLastRevealedWord(result.word);
                    setTimeout(() => setLastRevealedWord(null), 1500);
                }

                saveCache(
                    article.date,
                    newGuesses,
                    newRevealed,
                    undefined,
                    revealedImages,
                );

                if (checkWinCondition(article, newRevealed)) {
                    setWon(true);
                    const allWords = newGuesses.map((g) => g.word);
                    revealAllWords(article, allWords, newGuesses, newRevealed);
                    revealAllImages(article);
                }
            } catch {
                setError("Erreur lors de la soumission");
            } finally {
                setGuessing(false);
                setInput("");
                setTimeout(() => inputRef.current?.focus(), 0);
            }
        },
        [
            input,
            article,
            guessing,
            won,
            guesses,
            revealed,
            revealedImages,
            revealAllWords,
            revealAllImages,
            reloadArticle,
        ],
    );

    const markSaved = useCallback(() => {
        if (!article) return;
        setSaved(true);
        saveCache(article.date, guesses, revealed, true, revealedImages);
    }, [article, guesses, revealed, revealedImages]);

    const revealHint = useCallback(async () => {
        if (!article || won || revealingHint) return;
        const nextIndex = revealedImages.length;
        if (nextIndex >= (article.imageCount ?? 0)) return;

        setRevealingHint(true);
        try {
            const res = await fetch("/api/game/hint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hintIndex: nextIndex }),
            });
            if (!res.ok) return;
            const data = (await res.json()) as {
                imageUrl: string;
                hintIndex: number;
                totalImages: number;
            };
            const newImages = [...revealedImages, data.imageUrl];
            setRevealedImages(newImages);
            saveCache(article.date, guesses, revealed, saved, newImages);
        } catch {
            console.error("[hint] failed to reveal hint");
        } finally {
            setRevealingHint(false);
        }
    }, [article, won, revealingHint, revealedImages, guesses, revealed, saved]);

    return {
        article,
        guesses,
        revealed,
        input,
        setInput,
        loading,
        guessing,
        won,
        saved,
        error,
        lastGuessFound,
        lastGuessSimilarity,
        lastRevealedWord,
        setLastGuessFound,
        inputRef,
        percentage,
        submitGuess,
        markSaved,
        syncWithDatabase,
        syncToDatabase,
        synced,
        revealedImages,
        revealingHint,
        revealHint,
        hintsUsed,
        imageCount,
        score,
    };
}
