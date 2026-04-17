import { useCallback, useState } from "react";
import { MIN_GUESSES_FOR_HINT } from "@/constants/game";
import { useRevealAllWords } from "@/lib/query";
import { fetchImageHint } from "@/lib/query/client";
import type { MaskedArticle, RevealedMap, StoredGuess } from "@/types/game";
import { saveCache } from "@/utils/cache";
import { applyPositions } from "@/utils/helper";
import { useGameState } from "./useGameState";

const useGame = () => {
    const {
        article,
        won,
        guesses,
        revealed,
        setRevealed,
        saved,
        revealedImages,
        setRevealedImages,
        setWinImages,
    } = useGameState();
    const [revealingHint, setRevealingHint] = useState(false);

    // TanStack Query mutation for revealing all words
    const { mutateAsync: revealAllWordsAsync } = useRevealAllWords();

    const revealAllWords = useCallback(
        async (
            art: MaskedArticle,
            words: string[],
            currentGuesses: StoredGuess[],
            currentRevealed: RevealedMap,
        ) => {
            const reveal = await revealAllWordsAsync(words);
            if (reveal) {
                const fullRevealed = applyPositions(
                    currentRevealed,
                    reveal.positions,
                );
                setRevealed(fullRevealed);
                saveCache(art.date, currentGuesses, fullRevealed);
                return;
            }
        },
        [revealAllWordsAsync, setRevealed],
    );

    const revealAllImages = useCallback(
        async (art: MaskedArticle, currentGuesses: StoredGuess[]) => {
            const total = art.imageCount ?? 0;
            if (total === 0) return;
            const allImages: string[] = [];
            const words = currentGuesses.map((g) => g.word);

            // Fetch all images sequentially using TanStack Query
            for (let i = 0; i < total; i++) {
                try {
                    const hint = await fetchImageHint(i, words, true);
                    if (hint) {
                        allImages.push(hint.imageUrl);
                    }
                } catch (error) {
                    console.error(`[hint] failed to reveal hint ${i}`, error);
                }
            }
            setWinImages(allImages);
        },
        [setWinImages],
    );

    const revealHint = useCallback(async () => {
        if (!article || won || revealingHint) return;
        if (guesses.length < MIN_GUESSES_FOR_HINT) return;
        const nextIndex = revealedImages.length;
        if (nextIndex >= (article.imageCount ?? 0)) return;

        setRevealingHint(true);
        try {
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
        } catch (error) {
            console.error("[hint] error revealing hint:", error);
        } finally {
            setRevealingHint(false);
        }
    }, [
        article,
        won,
        revealingHint,
        revealedImages,
        guesses,
        revealed,
        saved,
        setRevealedImages,
    ]);

    return { revealAllWords, revealAllImages, revealHint, revealingHint };
};

export default useGame;
