"use client";

import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import * as atomGame from "@/atom/game";
import { HINT_PENALTY } from "@/lib/constants/game";
import { fetchGame } from "@/lib/queries";
import { clearOldCaches, loadCache } from "@/utils/cache";
import { checkWinCondition } from "@/utils/game";
import useDb from "./useDb";
import useGame from "./useGame";
import useGuess from "./useGuess";

export function useWikiGuessr() {
    const [article, setArticle] = useAtom(atomGame.articleAtom);
    const [guesses, setGuesses] = useAtom(atomGame.guessesAtom);
    const [revealed, setRevealed] = useAtom(atomGame.revealedAtom);
    const [loading, setLoading] = useAtom(atomGame.loadingAtom);
    const guessing = useAtomValue(atomGame.guessingAtom);
    const [won, setWon] = useAtom(atomGame.wonAtom);
    const [saved, setSaved] = useAtom(atomGame.savedAtom);
    const [error, setError] = useAtom(atomGame.errorAtom);
    const lastGuessSimilarity = useAtomValue(atomGame.lastGuessSimilarityAtom);

    const [revealedImages, setRevealedImages] = useAtom(
        atomGame.revealedImagesAtom,
    );
    const winImages = useAtomValue(atomGame.winImagesAtom);
    const revealingHint = useAtomValue(atomGame.revealingHintAtom);

    const revealedCount = Object.keys(revealed).length;
    const totalWords = article?.totalWords ?? 0;
    const percentage =
        totalWords > 0 ? Math.round((revealedCount / totalWords) * 100) : 0;
    const hintsUsed = revealedImages.length;
    const imageCount = article?.imageCount ?? 0;
    const score = guesses.length + hintsUsed * HINT_PENALTY;
    const displayImages =
        won && winImages.length > 0 ? winImages : revealedImages;

    const { revealAllWords, revealAllImages, revealHint } = useGame();
    const { submitGuess } = useGuess();
    useDb();

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
    }, [
        revealAllWords,
        revealAllImages,
        setArticle,
        setGuesses,
        setRevealed,
        setWon,
        setSaved,
        setError,
        setRevealedImages,
        setLoading,
    ]);

    return {
        article,
        guesses,
        revealed,
        loading,
        guessing,
        won,
        saved,
        error,
        lastGuessSimilarity,
        percentage,
        submitGuess,
        revealedImages: displayImages,
        revealingHint,
        revealHint,
        hintsUsed,
        imageCount,
        score,
    };
}
