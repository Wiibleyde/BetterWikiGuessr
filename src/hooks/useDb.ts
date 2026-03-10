import axios from "axios";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import * as atomGame from "@/atom/game";
import type { GameCache } from "@/types/game";
import { loadCache, saveCache } from "@/utils/cache";
import { checkWinCondition } from "@/utils/game";
import { fetchStateFromServer, pushStateToServer } from "@/utils/server";
import { useAuth } from "./useAuth";
import useGame from "./useGame";

const useDb = () => {
    const { user, loading: authLoading } = useAuth();
    const { revealAllWords, revealAllImages } = useGame();
    const article = useAtomValue(atomGame.articleAtom);
    const loading = useAtomValue(atomGame.loadingAtom);
    const [guesses, setGuesses] = useAtom(atomGame.guessesAtom);
    const [revealed, setRevealed] = useAtom(atomGame.revealedAtom);
    const won = useAtomValue(atomGame.wonAtom);
    const [saved, setSaved] = useAtom(atomGame.savedAtom);
    const revealedImages = useAtomValue(atomGame.revealedImagesAtom);
    const setWon = useSetAtom(atomGame.wonAtom);
    const [synced, setSynced] = useAtom(atomGame.syncedAtom);
    const setRevealedImages = useSetAtom(atomGame.revealedImagesAtom);

    /** Push current state to the DB (called on each guess when logged in). */
    const syncToDatabase = useCallback(async () => {
        if (!article) return;
        const cache: GameCache = { guesses, revealed, saved, revealedImages };
        await pushStateToServer(cache);
    }, [article, guesses, revealed, saved, revealedImages]);

    /**
     * Synchronize state with the database after login.
     * - If DB has state → replace localStorage & React state with DB values.
     * - If DB is empty but localStorage has data → push localStorage to DB.
     * - If both empty → do nothing.
     */
    const syncWithDatabase = useCallback(async () => {
        if (!article || synced) return;

        const dbState = await fetchStateFromServer();
        const localCache = loadCache(article.date);

        const dbCount = dbState?.guesses?.length ?? 0;
        const localCount = localCache?.guesses?.length ?? 0;

        if (dbState && dbCount > 0 && dbCount >= localCount) {
            // DB has equal or more progress — use it
            setGuesses(dbState.guesses);
            setRevealed(dbState.revealed);
            setRevealedImages(dbState.revealedImages ?? []);
            if (dbState.saved) {
                setSaved(true);
            }
            const isWon = checkWinCondition(article, dbState.revealed);
            if (isWon) {
                setWon(true);
                const words = dbState.guesses.map((g) => g.word);
                revealAllWords(
                    article,
                    words,
                    dbState.guesses,
                    dbState.revealed,
                );
                revealAllImages(article, dbState.guesses);
            }
            saveCache(
                article.date,
                dbState.guesses,
                dbState.revealed,
                dbState.saved,
                dbState.revealedImages,
            );
        } else if (localCache && localCount > 0) {
            // Local has more progress — push it to DB
            await pushStateToServer(localCache);
        }

        setSynced(true);
    }, [
        article,
        synced,
        revealAllWords,
        revealAllImages,
        setGuesses,
        setRevealed,
        setRevealedImages,
        setSaved,
        setWon,
        setSynced,
    ]);

    // Sync once after auth and game are both ready
    useEffect(() => {
        if (authLoading || loading || !article || !user) return;
        syncWithDatabase();
    }, [authLoading, loading, article, user, syncWithDatabase]);

    // Sync to DB after each new guess (guesses only grow, so any length change = new guess)
    useEffect(() => {
        if (!user || !synced || guesses.length === 0) return;
        syncToDatabase();
    }, [guesses.length, user, synced, syncToDatabase]);

    // Save game result when the user wins
    const savingRef = useRef(false);
    useEffect(() => {
        if (!won || !user || saved || savingRef.current || !article) return;
        savingRef.current = true;
        const hintsUsed = revealedImages.length;
        axios
            .post("/api/game/complete", {
                guessCount: guesses.length,
                guessedWords: guesses.map((g) => g.word),
                hintsUsed,
            })
            .then(() => {
                setSaved(true);
                saveCache(
                    article.date,
                    guesses,
                    revealed,
                    true,
                    revealedImages,
                );
                syncToDatabase();
            })
            .catch((err) => {
                if (axios.isAxiosError(err) && err.response) {
                    console.error(
                        "[game/complete] server error:",
                        err.response.status,
                    );
                }
                console.error("[game/complete]", err);
                savingRef.current = false;
            });
    }, [
        won,
        user,
        saved,
        article,
        guesses,
        revealed,
        revealedImages,
        setSaved,
        syncToDatabase,
    ]);

    return { syncToDatabase };
};

export default useDb;
