"use client";

import {
    type FormEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { normalizeWord } from "@/lib/normalize";
import type {
    GameCache,
    GuessResult,
    MaskedArticle,
    RevealedMap,
    StoredGuess,
    WordToken,
} from "@/types/game";

const STORAGE_KEY_PREFIX = "wikiguessr-";

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
) {
    localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${date}`,
        JSON.stringify({ guesses, revealed }),
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

export function useGameState() {
    const [article, setArticle] = useState<MaskedArticle | null>(null);
    const [guesses, setGuesses] = useState<StoredGuess[]>([]);
    const [revealed, setRevealed] = useState<RevealedMap>({});
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [guessing, setGuessing] = useState(false);
    const [won, setWon] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastGuessFound, setLastGuessFound] = useState<boolean | null>(null);
    const [lastGuessSimilarity, setLastGuessSimilarity] = useState<number>(0);
    const [lastRevealedWord, setLastRevealedWord] = useState<string | null>(
        null,
    );
    const inputRef = useRef<HTMLInputElement>(null);

    const revealedCount = Object.keys(revealed).length;
    const totalWords = article?.totalWords ?? 0;
    const percentage =
        totalWords > 0 ? Math.round((revealedCount / totalWords) * 100) : 0;

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
                    if (checkWinCondition(data, cache.revealed ?? {})) {
                        setWon(true);
                    }
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Impossible de charger l'article du jour");
                setLoading(false);
            });
    }, []);

    const submitGuess = useCallback(
        async (e?: FormEvent) => {
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

                saveCache(article.date, newGuesses, newRevealed);

                if (checkWinCondition(article, newRevealed)) {
                    setWon(true);
                }
            } catch {
                setError("Erreur lors de la soumission");
            } finally {
                setGuessing(false);
                setInput("");
                setTimeout(() => inputRef.current?.focus(), 0);
            }
        },
        [input, article, guessing, won, guesses, revealed],
    );

    return {
        article,
        guesses,
        revealed,
        input,
        setInput,
        loading,
        guessing,
        won,
        error,
        lastGuessFound,
        lastGuessSimilarity,
        lastRevealedWord,
        setLastGuessFound,
        inputRef,
        percentage,
        submitGuess,
    };
}
