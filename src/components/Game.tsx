"use client";

import ArticleView from "@/components/ArticleView";
import GameHeader from "@/components/GameHeader";
import GuessList from "@/components/GuessList";
import ImageHint from "@/components/ImageHint";
import { useWikiGuessr } from "@/hooks/useWikiGuessr";
import ErrorMessage from "./ui/Error";
import Loader from "./ui/Loader";
import NoDataMessage from "./ui/NoDataMessage";

export default function Game() {
    const {
        article,
        guesses,
        revealed,
        loading,
        guessing,
        won,
        error,
        lastGuessSimilarity,
        percentage,
        submitGuess,
        revealedImages,
        revealingHint,
        revealHint,
        hintsUsed,
        imageCount,
        score,
    } = useWikiGuessr();

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
                percentage={percentage}
                won={won}
                guessing={guessing}
                lastGuessSimilarity={lastGuessSimilarity}
                hintsUsed={hintsUsed}
                score={score}
                onSubmit={submitGuess}
            />

            <ImageHint
                imageCount={imageCount}
                revealedImages={revealedImages}
                revealingHint={revealingHint}
                won={won}
                onRevealHint={revealHint}
            />

            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
                <ArticleView
                    article={article}
                    revealed={revealed}
                />
                <GuessList guesses={guesses} />
            </div>
        </div>
    );
}
