"use client";

import { useCallback, useEffect, useState } from "react";
import { HINT_PENALTY, MIN_GUESSES_FOR_HINT } from "@/lib/constants/game";
import { normalizeWord } from "@/lib/game/normalize";
import {
    checkGameGuess,
    fetchGame,
    fetchGameReveal,
    fetchImageHint,
} from "@/lib/queries";
import type {
    GameCache,
    MaskedArticle,
    RevealedMap,
    StoredGuess,
} from "@/types/game";
import { clearOldCaches, loadCache, saveCache } from "@/utils/cache";
import { checkWinCondition } from "@/utils/game";
import { posKey } from "@/utils/helper";
import { fetchStateFromServer, pushStateToServer } from "@/utils/server";

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
    const [winImages, setWinImages] = useState<string[]>([]);
    const [revealingHint, setRevealingHint] = useState(false);

    const revealedCount = Object.keys(revealed).length;
    const totalWords = article?.totalWords ?? 0;
    const percentage =
        totalWords > 0 ? Math.round((revealedCount / totalWords) * 100) : 0;
    const hintsUsed = revealedImages.length;
    const imageCount = article?.imageCount ?? 0;
    const score = guesses.length + hintsUsed * HINT_PENALTY;
    const displayImages =
        won && winImages.length > 0 ? winImages : revealedImages;

    /** Fetch all images for the article (used after winning). */
    const revealAllImages = useCallback(
        async (art: MaskedArticle, currentGuesses: StoredGuess[]) => {
            const total = art.imageCount ?? 0;
            if (total === 0) return;
            const allImages: string[] = [];
            const words = currentGuesses.map((g) => g.word);
            for (let i = 0; i < total; i++) {
                const hint = await fetchImageHint(i, words, true);
                if (hint) allImages.push(hint.imageUrl);
            }
            setWinImages(allImages);
        },
        [],
    );

    /** Fetch all word positions from the server and reveal every word. */
    const revealAllWords = useCallback(
        async (
            art: MaskedArticle,
            words: string[],
            currentGuesses: StoredGuess[],
            currentRevealed: RevealedMap,
        ) => {
            const reveal = await fetchGameReveal(words);
            if (reveal) {
                const fullRevealed = { ...currentRevealed };
                for (const pos of reveal.positions) {
                    fullRevealed[posKey(pos.section, pos.part, pos.wordIndex)] =
                        pos.display;
                }
                setRevealed(fullRevealed);
                saveCache(art.date, currentGuesses, fullRevealed);
                return;
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
        setWinImages([]);

        const gameData = fetchGame();
        gameData
            .then((data) => {
                if (!data) {
                    setError("Impossible de charger l'article du jour");
                    setLoading(false);
                    return;
                }
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
                        const cachedGuesses = cache.guesses ?? [];
                        const words = cachedGuesses.map((g) => g.word);
                        revealAllWords(
                            data,
                            words,
                            cachedGuesses,
                            cache.revealed ?? {},
                        );
                        revealAllImages(data, cachedGuesses);
                    }
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Impossible de charger l'article du jour");
                setLoading(false);
            });
    }, [revealAllWords, revealAllImages]);

    useEffect(() => {
        const gameData = fetchGame();
        gameData
            .then((data) => {
                if (!data) {
                    setError("Impossible de charger l'article du jour");
                    setLoading(false);
                    return;
                }
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
                        const cachedGuesses = cache.guesses ?? [];
                        const words = cachedGuesses.map((g) => g.word);
                        revealAllWords(
                            data,
                            words,
                            cachedGuesses,
                            cache.revealed ?? {},
                        );
                        revealAllImages(data, cachedGuesses);
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
                revealAllImages(article, dbState.guesses);
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
                const foundWords = guesses
                    .filter((g) => g.found)
                    .map((g) => g.word);

                const guessResult = await checkGameGuess(raw, foundWords);

                if (!guessResult) {
                    throw new Error("Erreur lors de la vérification du mot");
                }

                // Detect server day change — discard this guess & reload
                if (guessResult.serverDate !== article.date) {
                    reloadArticle();
                    return;
                }

                const newGuess: StoredGuess = {
                    word: guessResult.word,
                    found: guessResult.found,
                    occurrences: guessResult.occurrences,
                    similarity: guessResult.similarity,
                    proximityReason: guessResult.proximityReason,
                };

                const newGuesses = [newGuess, ...guesses];
                const newRevealed = { ...revealed };
                for (const pos of guessResult.positions) {
                    newRevealed[posKey(pos.section, pos.part, pos.wordIndex)] =
                        pos.display;
                }

                setGuesses(newGuesses);
                setRevealed(newRevealed);
                setLastGuessFound(guessResult.found);
                setLastGuessSimilarity(guessResult.similarity);

                if (guessResult.found && guessResult.similarity === 1) {
                    setLastRevealedWord(guessResult.word);
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
                    revealAllImages(article, newGuesses);
                }
            } catch {
                setError("Erreur lors de la soumission");
            } finally {
                setGuessing(false);
                setInput("");
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
        if (guesses.length < MIN_GUESSES_FOR_HINT) return;
        const nextIndex = revealedImages.length;
        if (nextIndex >= (article.imageCount ?? 0)) return;

        setRevealingHint(true);
        const hint = await fetchImageHint(
            nextIndex,
            guesses.map((g) => g.word),
        );
        if (hint) {
            const newImages = [...revealedImages, hint.imageUrl];
            setRevealedImages(newImages);
            saveCache(article.date, guesses, revealed, saved, newImages);
        } else {
            console.error("[hint] failed to reveal hint");
        }
        setRevealingHint(false);
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
        percentage,
        submitGuess,
        markSaved,
        syncWithDatabase,
        syncToDatabase,
        synced,
        revealedImages: displayImages,
        revealingHint,
        revealHint,
        hintsUsed,
        imageCount,
        score,
    };
}
