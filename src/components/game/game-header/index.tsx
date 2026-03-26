"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { guessesAtom, inputAtom, lastGuessFoundAtom } from "@/atom/game";
import YesterdayWord from "@/components/game/game-header/YesterdayWord";
import { formatDateWithMonthName } from "@/utils/date";
import { plural } from "@/utils/helper";
import Input from "./Input";

interface GameHeaderProps {
    date: string;
    percentage: number;
    won: boolean;
    hintsUsed: number;
    onSubmit: (e?: React.FormEvent) => void;
}

export default function GameHeader({
    date,
    percentage,
    won,
    hintsUsed,
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
                    <span>{formatDateWithMonthName(date)}</span>
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
                            {` Trouvé en ${plural(guesses.length, "essai", "essais")}${hintsUsed > 0 ? ` avec ${plural(hintsUsed, "indice", "indices")}` : ""} !`}
                        </p>
                    </div>
                ) : (
                    <Input
                        input={input}
                        onInputChange={onInputChange}
                        onSubmit={onSubmit}
                    />
                )}
            </div>
        </div>
    );
}
