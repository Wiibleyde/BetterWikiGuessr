import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
    articleAtom,
    guessesAtom,
    revealedAtom,
    revealedImagesAtom,
    revealingHintAtom,
    savedAtom,
    winImagesAtom,
    wonAtom,
} from "@/atom/game";
import { MIN_GUESSES_FOR_HINT } from "@/constants/game";
import { fetchGameReveal, fetchImageHint } from "@/lib/queries";
import type { MaskedArticle, RevealedMap, StoredGuess } from "@/types/game";
import { saveCache } from "@/utils/cache";
import { posKey } from "@/utils/helper";

const useGame = () => {
    const setWinImages = useSetAtom(winImagesAtom);
    const [revealingHint, setRevealingHint] = useAtom(revealingHintAtom);
    const [revealedImages, setRevealedImages] = useAtom(revealedImagesAtom);
    const article = useAtomValue(articleAtom);
    const won = useAtomValue(wonAtom);
    const guesses = useAtomValue(guessesAtom);
    const [revealed, setRevealed] = useAtom(revealedAtom);
    const saved = useAtomValue(savedAtom);

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
        [setRevealed],
    );

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
        [setWinImages],
    );

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
    }, [
        article,
        won,
        revealingHint,
        revealedImages,
        guesses,
        revealed,
        saved,
        setRevealedImages,
        setRevealingHint,
    ]);

    return { revealAllWords, revealAllImages, revealHint };
};

export default useGame;
