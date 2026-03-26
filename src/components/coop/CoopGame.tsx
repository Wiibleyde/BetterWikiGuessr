"use client";

import { useAtomValue } from "jotai";
import {
    coopArticleAtom,
    coopGuessesAtom,
    coopPlayerIdAtom,
    coopPlayersAtom,
    coopRevealedAtom,
    coopWonAtom,
} from "@/atom/coop";
import ArticleView from "@/components/game/article";
import useCoopGuess from "@/hooks/useCoopGuess";
import useCoopLobby from "@/hooks/useCoopLobby";
import CoopGameHeader from "./CoopGameHeader";
import CoopGuessList from "./CoopGuessList";
import CoopPlayerList from "./CoopPlayerList";

interface CoopGameProps {
    code: string;
}

export default function CoopGame({ code }: CoopGameProps) {
    const article = useAtomValue(coopArticleAtom);
    const guesses = useAtomValue(coopGuessesAtom);
    const revealed = useAtomValue(coopRevealedAtom);
    const players = useAtomValue(coopPlayersAtom);
    const won = useAtomValue(coopWonAtom);
    const playerId = useAtomValue(coopPlayerIdAtom);
    const { percentage } = useCoopLobby();
    const { input, setInput, submitGuess, guessing } = useCoopGuess(code);

    if (!article) return null;

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            <CoopGameHeader
                percentage={percentage}
                won={won}
                guessCount={guesses.length}
                playerCount={players.length}
                input={input}
                onInputChange={setInput}
                onSubmit={submitGuess}
                guessing={guessing}
            />

            <div className="max-w-5xl mx-auto px-4 py-4">
                <CoopPlayerList players={players} currentPlayerId={playerId} />
            </div>

            <div className="max-w-5xl mx-auto px-4 pb-6 flex flex-col lg:flex-row gap-6">
                <ArticleView article={article} revealed={revealed} />
                <CoopGuessList guesses={guesses} players={players} />
            </div>
        </div>
    );
}
