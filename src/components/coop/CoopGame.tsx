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
import { plural } from "@/utils/helper";
import GameHeader from "../game/game-header";
import GuessList from "../game/guess-list";
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
            <GameHeader
                date={article.date}
                percentage={percentage}
                won={won}
                hintsUsed={0}
                onSubmit={submitGuess}
                coop
                input={input}
                setInput={setInput}
                guessCount={guesses.length}
                guessing={guessing}
                datas={[
                    plural(players.length, "joueur", "joueurs"),
                    plural(guesses.length, "essai", "essais"),
                    plural(percentage, "% révélé", "% révélés"),
                ]}
            />

            <div className="max-w-5xl mx-auto px-4 py-4">
                <CoopPlayerList players={players} currentPlayerId={playerId} />
            </div>

            <div className="max-w-5xl mx-auto px-4 pb-6 flex flex-col lg:flex-row gap-6">
                <ArticleView article={article} revealed={revealed} />
                <GuessList guesses={guesses} />
            </div>
        </div>
    );
}
