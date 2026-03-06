"use client";

import axios from "axios";
import { useEffect, useRef } from "react";
import ArticleView from "@/components/ArticleView";
import GameHeader from "@/components/GameHeader";
import GuessList from "@/components/GuessList";
import ImageHint from "@/components/ImageHint";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import ErrorMessage from "./ui/Error";
import Loader from "./ui/Loader";
import NoDataMessage from "./ui/NoDataMessage";

export default function Game() {
    const { user, loading: authLoading } = useAuth();
    const {
        article,
        guesses,
        revealed,
        input,
        setInput,
        loading,
        guessing,
        won,
        saved,
        error,
        lastGuessFound,
        lastGuessSimilarity,
        lastRevealedWord,
        setLastGuessFound,
        percentage,
        submitGuess,
        markSaved,
        syncWithDatabase,
        syncToDatabase,
        synced,
        revealedImages,
        revealingHint,
        revealHint,
        hintsUsed,
        imageCount,
        score,
    } = useGameState();

    // After auth resolves and game is loaded, sync state with database
    const syncInitRef = useRef(false);
    useEffect(() => {
        if (authLoading || loading || !article || syncInitRef.current) return;
        if (!user) {
            syncInitRef.current = true;
            return;
        }
        syncInitRef.current = true;
        syncWithDatabase();
    }, [authLoading, loading, article, user, syncWithDatabase]);

    // Sync to DB after each guess (when logged in and synced)
    const prevGuessCount = useRef(guesses.length);
    useEffect(() => {
        if (!user || !synced) return;
        if (guesses.length > prevGuessCount.current) {
            syncToDatabase();
        }
        prevGuessCount.current = guesses.length;
    }, [guesses.length, user, synced, syncToDatabase]);

    const savingRef = useRef(false);
    useEffect(() => {
        if (!won || !user || saved || savingRef.current) return;
        savingRef.current = true;
        axios
            .post("/api/game/complete", {
                guessCount: guesses.length,
                guessedWords: guesses.map((g) => g.word),
                hintsUsed,
            })
            .then(() => {
                markSaved();
                // Also sync the final state (with saved=true) to DB
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
    }, [won, user, saved, guesses, hintsUsed, markSaved, syncToDatabase]);

    if (loading) return <Loader message="Chargement de l'article du jour…" />;

    if (error && !article) return <ErrorMessage message={error} />;

    if (!article)
        return (
            <NoDataMessage message="Aucun article disponible pour le moment. Veuillez réessayer plus tard." />
        );

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            <GameHeader
                date={article.date}
                guessCount={guesses.length}
                percentage={percentage}
                won={won}
                guessing={guessing}
                input={input}
                lastGuessFound={lastGuessFound}
                lastGuessSimilarity={lastGuessSimilarity}
                hintsUsed={hintsUsed}
                score={score}
                onInputChange={(value) => {
                    setInput(value);
                    setLastGuessFound(null);
                }}
                onSubmit={submitGuess}
            />

            <ImageHint
                imageCount={imageCount}
                revealedImages={revealedImages}
                revealingHint={revealingHint}
                won={won}
                guessCount={guesses.length}
                onRevealHint={revealHint}
            />

            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
                <ArticleView
                    article={article}
                    revealed={revealed}
                    lastRevealedWord={lastRevealedWord}
                />
                <GuessList guesses={guesses} />
            </div>
        </div>
    );
}
