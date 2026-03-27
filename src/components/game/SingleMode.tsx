"use client";
import { useAtomValue } from "jotai";
import { guessingAtom } from "@/atom/game";
import { useWikiGuessr } from "@/hooks/useWikiGuessr";
import Game from ".";

const SingleMode = () => {
    const guessing = useAtomValue(guessingAtom);
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
        input,
        setInput,
    } = useWikiGuessr();

    return (
        <Game
            article={article}
            guesses={guesses}
            revealed={revealed}
            loading={loading}
            won={won}
            error={error}
            percentage={percentage}
            submitGuess={submitGuess}
            revealedImages={revealedImages}
            revealingHint={revealingHint}
            revealHint={revealHint}
            hintsUsed={hintsUsed}
            imageCount={imageCount}
            input={input}
            setInput={setInput}
            guessing={guessing}
        />
    );
};

export default SingleMode;
