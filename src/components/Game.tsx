"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGameState } from "@/hooks/useGameState";
import ArticleView from "./ArticleView";
import GameHeader from "./GameHeader";
import GuessList from "./GuessList";

export default function Game() {
    const { user, loading: authLoading, login, logout } = useAuth();
    const {
        article,
        guesses,
        revealed,
        input,
        setInput,
        loading,
        guessing,
        won,
        error,
        lastGuessFound,
        lastGuessSimilarity,
        lastRevealedWord,
        setLastGuessFound,
        inputRef,
        percentage,
        submitGuess,
    } = useGameState();

    const savedRef = useRef(false);
    useEffect(() => {
        if (!won || !user || savedRef.current) return;
        savedRef.current = true;
        fetch("/api/game/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                guessCount: guesses.length,
                guessedWords: guesses.map((g) => g.word),
            }),
        }).catch((err) => console.error("[game/complete]", err));
    }, [won, user, guesses]);

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
                user={user}
                authLoading={authLoading}
                onLogin={login}
                onLogout={logout}
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
                <GuessList guesses={guesses} />
            </div>
        </div>
    );
}
