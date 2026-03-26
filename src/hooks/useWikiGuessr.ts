"use client";

import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import * as atomGame from "@/atom/game";
import { computeRevealPercentage } from "@/utils/game";
import useArticle from "./useArticle";
import useDb from "./useDb";
import useGame from "./useGame";
import useGuess from "./useGuess";

export function useWikiGuessr() {
    const article = useAtomValue(atomGame.articleAtom);
    const guesses = useAtomValue(atomGame.guessesAtom);
    const revealed = useAtomValue(atomGame.revealedAtom);
    const loading = useAtomValue(atomGame.loadingAtom);
    const won = useAtomValue(atomGame.wonAtom);
    const saved = useAtomValue(atomGame.savedAtom);
    const error = useAtomValue(atomGame.errorAtom);
    const revealedImages = useAtomValue(atomGame.revealedImagesAtom);
    const winImages = useAtomValue(atomGame.winImagesAtom);
    const revealingHint = useAtomValue(atomGame.revealingHintAtom);
    const [input, setInput] = useAtom(atomGame.inputAtom);

    const percentage = computeRevealPercentage(revealed, article);
    const hintsUsed = revealedImages.length;
    const imageCount = article?.imageCount ?? 0;
    const displayImages =
        won && winImages.length > 0 ? winImages : revealedImages;

    const { revealHint } = useGame();
    const { submitGuess } = useGuess();
    const { reloadArticle } = useArticle();
    useDb();

    useEffect(() => {
        reloadArticle();
    }, [reloadArticle]);

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
    };
}
