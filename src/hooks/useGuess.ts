import { useCallback } from "react";
import { normalizeWord } from "@/lib/game/normalize";
import { useSubmitGuess } from "@/lib/query";
import type { StoredGuess } from "@/types/game";
import { saveCache } from "@/utils/cache";
import { checkWinCondition } from "@/utils/game";
import { applyPositions } from "@/utils/helper";
import useArticle from "./useArticle";
import useGame from "./useGame";
import { useGameState } from "./useGameState";

const useGuess = () => {
    const { reloadArticle } = useArticle();
    const {
        input,
        setInput,
        article,
        revealed,
        setRevealed,
        guesses,
        setGuesses,
        revealedImages,
        won,
        setWon,
        setError,
    } = useGameState();

    // TanStack Query mutation for submitting guess
    const { mutateAsync: submitGuessMutation, isPending: guessing } =
        useSubmitGuess();
    const { revealAllWords, revealAllImages } = useGame();

    const submitGuess = useCallback<(e?: React.FormEvent) => Promise<void>>(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            if (!input.trim() || !article || won || guessing) return;

            const raw = input.trim();
            const normalized = normalizeWord(raw);

            if (guesses.some((g) => g.word === normalized)) {
                setInput("");
                return;
            }

            try {
                const foundWords = guesses
                    .filter((g) => g.found)
                    .map((g) => g.word);

                const guessResult = await submitGuessMutation({
                    word: raw,
                    revealedWords: foundWords,
                });

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
                const newRevealed = applyPositions(
                    revealed,
                    guessResult.positions,
                );

                setGuesses(newGuesses);
                setRevealed(newRevealed);

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
                setInput("");
            }
        },
        [
            input,
            article,
            won,
            guessing,
            guesses,
            revealed,
            revealedImages,
            revealAllWords,
            revealAllImages,
            reloadArticle,
            setGuesses,
            setRevealed,
            setError,
            setInput,
            setWon,
            submitGuessMutation,
        ],
    );

    return { submitGuess, guessing };
};

export default useGuess;
