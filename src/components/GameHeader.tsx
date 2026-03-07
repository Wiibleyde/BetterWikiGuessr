"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { guessesAtom, inputAtom, lastGuessFoundAtom } from "@/atom/game";
import YesterdayWord from "@/components/YesterdayWord";
import { plural } from "@/utils/helper";

interface GameHeaderProps {
    date: string;
    percentage: number;
    won: boolean;
    guessing: boolean;
    hintsUsed: number;
    score: number;
    onSubmit: (e?: React.FormEvent) => void;
}

export default function GameHeader({
    date,
    percentage,
    won,
    guessing,
    hintsUsed,
    score,
    onSubmit,
}: GameHeaderProps) {

    const [input, setInput] = useAtom(inputAtom);
    const setLastGuessFound = useSetAtom(lastGuessFoundAtom);
    const guesses = useAtomValue(guessesAtom);

    const onInputChange = (value: string) => {
        setInput(value);
        setLastGuessFound(null);
    };

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                    <span>{date}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>
                        {plural(guesses.length, "essai", "essais")}
                        {hintsUsed > 0 && (
                            <span className="text-amber-500">
                                {" "}
                                {plural(hintsUsed, "indice", "indices")}
                            </span>
                        )}
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span>{percentage}% révélé</span>
                    <span>·</span>
                    <span className="hidden sm:inline">
                        <YesterdayWord />
                    </span>
                </div>
                <div className="sm:hidden text-xs text-gray-500">
                    <YesterdayWord />
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {won ? (
                    <div className="bg-emerald-50 border  border-emerald-300 rounded-lg p-3 text-center">
                        <p className="text-emerald-800 font-bold text-lg">
                            Bravo !
                            {hintsUsed > 0
                                ? ` Score : ${score} (${plural(guesses.length, "essai", "essais")} + ${plural(hintsUsed, "indice", "indices")})`
                                : ` Trouvé en ${plural(guesses.length, "essai", "essais")} !`}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder="Devinez un mot…"
                            className={"min-w-0 flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"}
                            readOnly={guessing}
                        />
                        <button
                            type="submit"
                            disabled={guessing || !input.trim()}
                            className="shrink-0 px-4 sm:px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {guessing ? "…" : "Deviner"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
