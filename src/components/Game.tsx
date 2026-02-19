"use client";

import { useEffect, useRef } from "react";
import ArticleView from "@/components/ArticleView";
import GameHeader from "@/components/GameHeader";
import GuessList from "@/components/GuessList";
import YesterdayWord from "@/components/YesterdayWord";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";

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
        inputRef,
        percentage,
        submitGuess,
        markSaved,
        syncWithDatabase,
        syncToDatabase,
        startPeriodicSync,
        stopPeriodicSync,
        synced,
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

    // Start/stop periodic sync based on auth state
    useEffect(() => {
        if (user && synced) {
            startPeriodicSync();
        }
        return () => {
            stopPeriodicSync();
        };
    }, [user, synced, startPeriodicSync, stopPeriodicSync]);

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
        fetch("/api/game/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                guessCount: guesses.length,
                guessedWords: guesses.map((g) => g.word),
            }),
        })
            .then((res) => {
                if (res.ok) {
                    markSaved();
                    // Also sync the final state (with saved=true) to DB
                    syncToDatabase();
                } else {
                    console.error("[game/complete] server error:", res.status);
                    savingRef.current = false;
                }
            })
            .catch((err) => {
                console.error("[game/complete]", err);
                savingRef.current = false;
            });
    }, [won, user, saved, guesses, markSaved, syncToDatabase]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-gray-500 text-lg animate-pulse">
                    Chargement de l&apos;article du jour…
                </p>
            </div>
        );
    }

    if (error && !article) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    if (!article) return null;

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
                inputRef={inputRef}
                onInputChange={(value) => {
                    setInput(value);
                    setLastGuessFound(null);
                }}
                onSubmit={submitGuess}
            />

            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
                <ArticleView
                    article={article}
                    revealed={revealed}
                    lastRevealedWord={lastRevealedWord}
                />
                <div className="lg:w-72 w-full shrink-0 flex flex-col gap-4">
                    <YesterdayWord />
                    <GuessList guesses={guesses} />
                </div>
            </div>
        </div>
    );
}
