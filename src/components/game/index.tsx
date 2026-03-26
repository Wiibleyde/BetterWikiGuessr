"use client";

import GameHeader from "@/components/game/game-header";
import ImageHint from "@/components/game/ImageHint";
import { useWikiGuessr } from "@/hooks/useWikiGuessr";
import ErrorMessage from "../ui/Error";
import Loader from "../ui/Loader";
import NoDataMessage from "../ui/NoDataMessage";
import ArticleView from "./article";
import GuessList from "./guess-list";

export default function Game() {
    const {
        article,
        guesses,
        revealed,
        loading,
        won,
        error,
        percentage,
        submitGuess,
        revealedImages,
        revealingHint,
        revealHint,
        hintsUsed,
        imageCount,
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
                hintsUsed={hintsUsed}
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
                <ArticleView article={article} revealed={revealed} />
                <GuessList guesses={guesses} />
            </div>
        </div>
    );
}
