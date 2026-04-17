import { useCallback, useEffect } from "react";
import { checkWinCondition } from "@/lib/game/progress";
import { useFetchGame, useFetchYesterdayWord } from "@/lib/query";
import { clearOldCaches, loadCache } from "@/utils/cache";
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

    // Use TanStack Query hooks
    const {
        data: gameData,
        isLoading: gameLoading,
        error: gameError,
        refetch: refetchGame,
    } = useFetchGame();

    const {
        data: yesterdayData,
        error: yesterdayError,
        refetch: refetchYesterday,
    } = useFetchYesterdayWord();

    // Effect to handle game data loading
    useEffect(() => {
        if (gameLoading) {
            setLoading(true);
        }
    }, [gameLoading, setLoading]);

    // Effect to handle game data when loaded
    useEffect(() => {
        if (gameData) {
            setArticle(gameData);
            clearOldCaches(gameData.date);

            const cache = loadCache(gameData.date);
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
                if (checkWinCondition(gameData, cachedRevealed)) {
                    setWon(true);
                    revealAllWords(
                        gameData,
                        cachedGuesses.map((g) => g.word),
                        cachedGuesses,
                        cachedRevealed,
                    );
                    revealAllImages(gameData, cachedGuesses);
                }
            }
            setLoading(false);
        }
    }, [
        gameData,
        setArticle,
        setGuesses,
        setRevealed,
        setWon,
        setSaved,
        setRevealedImages,
        revealAllWords,
        revealAllImages,
        setLoading,
    ]);

    // Effect to handle yesterday data
    useEffect(() => {
        if (yesterdayData) {
            setYesterday(yesterdayData);
        }
    }, [yesterdayData, setYesterday]);

    // Effect to handle errors
    useEffect(() => {
        if (gameError) {
            setError("Impossible de charger l'article du jour");
            setLoading(false);
        }
    }, [gameError, setError, setLoading]);

    useEffect(() => {
        if (yesterdayError) {
            setYesterday(null);
        }
    }, [yesterdayError, setYesterday]);

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

        // Refetch with TanStack Query
        refetchGame();
        refetchYesterday();
    }, [
        setLoading,
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
        refetchGame,
        refetchYesterday,
    ]);

    return { reloadArticle };
};

export default useArticle;
