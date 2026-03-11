import { useSetAtom } from "jotai";
import { useCallback } from "react";
import {
    articleAtom,
    errorAtom,
    guessesAtom,
    inputAtom,
    loadingAtom,
    revealedAtom,
    revealedImagesAtom,
    savedAtom,
    syncedAtom,
    winImagesAtom,
    wonAtom,
} from "@/atom/game";
import { fetchGame } from "@/lib/queries";
import { clearOldCaches, loadCache } from "@/utils/cache";
import { checkWinCondition } from "@/utils/game";
import useGame from "./useGame";

const useArticle = () => {
    const setGuesses = useSetAtom(guessesAtom);
    const setLoading = useSetAtom(loadingAtom);
    const setRevealed = useSetAtom(revealedAtom);
    const setWon = useSetAtom(wonAtom);
    const setSaved = useSetAtom(savedAtom);
    const setError = useSetAtom(errorAtom);
    const setSynced = useSetAtom(syncedAtom);
    const setInput = useSetAtom(inputAtom);
    const setRevealedImages = useSetAtom(revealedImagesAtom);
    const setWinImages = useSetAtom(winImagesAtom);
    const setArticle = useSetAtom(articleAtom);

    const { revealAllWords, revealAllImages } = useGame();

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

        fetchGame()
            .then((data) => {
                if (!data) {
                    setError("Impossible de charger l'article du jour");
                    return;
                }
                setArticle(data);
                clearOldCaches(data.date);

                const cache = loadCache(data.date);
                if (cache) {
                    const cachedGuesses = cache.guesses ?? [];
                    const cachedRevealed = cache.revealed ?? {};
                    setGuesses(cachedGuesses);
                    setRevealed(cachedRevealed);
                    setRevealedImages(cache.revealedImages ?? []);
                    if (cache.saved) setSaved(true);
                    if (checkWinCondition(data, cachedRevealed)) {
                        setWon(true);
                        revealAllWords(
                            data,
                            cachedGuesses.map((g) => g.word),
                            cachedGuesses,
                            cachedRevealed,
                        );
                        revealAllImages(data, cachedGuesses);
                    }
                }
            })
            .catch(() => setError("Impossible de charger l'article du jour"))
            .finally(() => setLoading(false));
    }, [
        revealAllWords,
        revealAllImages,
        setArticle,
        setGuesses,
        setRevealed,
        setWon,
        setSaved,
        setSynced,
        setError,
        setInput,
        setRevealedImages,
        setWinImages,
        setLoading,
    ]);

    return { reloadArticle };
};

export default useArticle;
