import { useCallback } from "react";
import { fetchGame, fetchYesterdayWord } from "@/lib/queries";
import { clearOldCaches, loadCache } from "@/utils/cache";
import { checkWinCondition } from "@/utils/game";
import { normalizeHintImageUrls } from "@/utils/hintImage";
import useGame from "./useGame";
import { useGameState } from "./useGameState";

const useArticle = () => {
    const {
        setGuesses,
        setLoading,
        setRevealed,
        setWon,
        setSaved,
        setError,
        setSynced,
        setInput,
        setRevealedImages,
        setWinImages,
        setArticle,
        setYesterday,
    } = useGameState();

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
        setYesterday(null);

        fetchYesterdayWord()
            .then((title) => {
                setYesterday(title);
            })
            .catch(() => {
                setYesterday(null);
            });

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
                    const cachedRevealedImages = normalizeHintImageUrls(
                        cache.revealedImages,
                    );
                    setGuesses(cachedGuesses);
                    setRevealed(cachedRevealed);
                    setRevealedImages(cachedRevealedImages);
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
        setYesterday,
        setLoading,
    ]);

    return { reloadArticle };
};

export default useArticle;
