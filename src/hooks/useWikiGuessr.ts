"use client";

import { computeRevealPercentage } from "@/lib/game/progress";
import useArticle from "./useArticle";
import useDb from "./useDb";
import useGame from "./useGame";
import { useGameState } from "./useGameState";
import useGuess from "./useGuess";

export function useWikiGuessr() {
    const {
        article,
        guesses,
        revealed,
        loading,
        won,
        saved,
        error,
        revealedImages,
        winImages,
        input,
        setInput,
    } = useGameState();

    const percentage = computeRevealPercentage(revealed, article);
    const hintsUsed = revealedImages.length;
    const imageCount = article?.imageCount ?? 0;
    const displayImages =
        won && winImages.length > 0 ? winImages : revealedImages;

    const { revealHint, revealingHint } = useGame();
    const { submitGuess, guessing } = useGuess();
    useArticle();
    useDb();

    return {
        article,
        guesses,
        revealed,
        loading,
        won,
        saved,
        error,
        percentage,
        submitGuess,
        revealedImages: displayImages,
        revealingHint,
        revealHint,
        hintsUsed,
        imageCount,
        input,
        setInput,
        guessing,
    };
}
