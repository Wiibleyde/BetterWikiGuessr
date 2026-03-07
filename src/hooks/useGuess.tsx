import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
    articleAtom,
    errorAtom,
    guessesAtom,
    guessingAtom,
    inputAtom,
    lastGuessFoundAtom,
    revealedAtom,
    revealedImagesAtom,
    wonAtom
} from "@/atom/game";
import { normalizeWord } from "@/lib/game/normalize";
import { checkGameGuess } from "@/lib/queries";
import type { StoredGuess } from "@/types/game";
import { saveCache } from "@/utils/cache";
import { checkWinCondition } from "@/utils/game";
import { posKey } from "@/utils/helper";
import useArticle from "./useArticle";
import useGame from "./useGame";

const useGuess = () => {
    const { reloadArticle } = useArticle();
    const [input, setInput] = useAtom(inputAtom);
    const article = useAtomValue(articleAtom);
    const [guessing, setGuessing] = useAtom(guessingAtom);
    const setLastGuessFound = useSetAtom(lastGuessFoundAtom);
    const [revealed, setRevealed] = useAtom(revealedAtom);
    const [guesses, setGuesses] = useAtom(guessesAtom);
    const revealedImages = useAtomValue(revealedImagesAtom);
    const [won, setWon] = useAtom(wonAtom);
    const setError = useSetAtom(errorAtom);
    const { revealAllWords, revealAllImages } = useGame();

    const submitGuess = useCallback<(e?: React.FormEvent) => Promise<void>>(
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
            setGuesses,
            setRevealed,
            setLastGuessFound,
            setError,
            setInput,
            setWon,
            setGuessing,
        ],
    );

    return { submitGuess };
};

export default useGuess;
