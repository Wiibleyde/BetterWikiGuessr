"use client";
import { useAtomValue } from "jotai";
import {
    coopArticleAtom,
    coopGuessesAtom,
    coopPlayersAtom,
    coopRevealedAtom,
    coopWonAtom,
} from "@/atom/coop";
import useCoopGuess from "@/hooks/useCoopGuess";
import useCoopLobby from "@/hooks/useCoopLobby";
import Game from ".";

interface CoopGameProps {
    code: string;
    onLeave: () => void;
}

const CoopMode = ({ code, onLeave }: CoopGameProps) => {
    const article = useAtomValue(coopArticleAtom);
    const guesses = useAtomValue(coopGuessesAtom);
    const revealed = useAtomValue(coopRevealedAtom);
    const players = useAtomValue(coopPlayersAtom);
    const won = useAtomValue(coopWonAtom);
    const { percentage } = useCoopLobby();
    const { input, setInput, submitGuess, guessing } = useCoopGuess(code);

    if (!article) return null;

    return (
        <Game
            article={article}
            guesses={guesses}
            revealed={revealed}
            error={null}
            loading={false}
            won={won}
            percentage={percentage}
            submitGuess={submitGuess}
            revealedImages={[]}
            revealingHint={false}
            revealHint={() => {}}
            hintsUsed={0}
            imageCount={article.imageCount}
            input={input}
            setInput={setInput}
            guessing={guessing}
            players={players}
            coop
            onLeave={onLeave}
        />
    );
};

export default CoopMode;
