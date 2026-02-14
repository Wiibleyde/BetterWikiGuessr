"use client";

import { useGameState } from "@/hooks/useGameState";
import ArticleView from "./ArticleView";
import GameHeader from "./GameHeader";
import GuessList from "./GuessList";

export default function Game() {
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
                <GuessList guesses={guesses} />
            </div>
        </div>
    );
}
