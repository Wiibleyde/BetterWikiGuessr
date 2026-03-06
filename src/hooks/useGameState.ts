"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { normalizeWord } from "@/lib/game/normalize";
import type {
    DateResponse,
    GameCache,
    GuessResult,
    HintResponse,
    MaskedArticle,
    RevealedMap,
    RevealResponse,
    StoredGuess, WordToken
} from "@/types/game";
import { HINT_PENALTY } from "@/types/game";
import { clearOldCaches, loadCache, saveCache } from "@/utils/cache";
import { posKey } from "@/utils/helper";
import { fetchStateFromServer, pushStateToServer } from "@/utils/server";

const DATE_CHECK_INTERVAL_MS = 60_000;

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
    const revealAllImages = useCallback(async (art: MaskedArticle) => {
        const total = art.imageCount ?? 0;
        if (total === 0) return;
        const allImages: string[] = [];
        for (let i = 0; i < total; i++) {
            try {
                const response = await axios.post(
                    "/api/game/hint",
                    { hintIndex: i },
                    { validateStatus: () => true },
                );
                if (response.status < 200 || response.status >= 300) continue;
                const data = response.data as HintResponse;
                allImages.push(data.imageUrl);
            } catch {
                // skip failed image
            }
        }
        setWinImages(allImages);
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
                const response = await axios.post(
                    "/api/game/reveal",
                    { words },
                    { validateStatus: () => true },
                );
                if (response.status < 200 || response.status >= 300) return;
                const data = response.data as RevealResponse;
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
        setWinImages([]);

        axios
            .get<MaskedArticle>("/api/game")
            .then((response) => {
                const data = response.data;
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

    // Periodically check if the server day has changed
    useEffect(() => {
        if (!article) return;

        const timer = setInterval(async () => {
            try {
                const response = await axios.get<DateResponse>(
                    "/api/game/date",
                    { validateStatus: () => true },
                );
                if (response.status < 200 || response.status >= 300) return;
                if (response.data.date !== article.date) {
                    reloadArticle();
                }
            } catch {
                // Silently ignore — will retry on next interval
            }
        }, DATE_CHECK_INTERVAL_MS);

        return () => clearInterval(timer);
    }, [article, reloadArticle]);

    useEffect(() => {
        axios
            .get<MaskedArticle>("/api/game")
            .then((response) => {
                const data = response.data;
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

                const response = await axios.post(
                    "/api/game/guess",
                    {
                        word: raw,
                        revealedWords: foundWords,
                    },
                    { validateStatus: () => true },
                );

                if (response.status < 200 || response.status >= 300) {
                    throw new Error("Erreur serveur");
                }

                const result = response.data as GuessResult;

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
                    proximityReason: result.proximityReason,
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
            const response = await axios.post(
                "/api/game/hint",
                { hintIndex: nextIndex },
                { validateStatus: () => true },
            );
            if (response.status < 200 || response.status >= 300) return;
            const data = response.data as HintResponse;
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
