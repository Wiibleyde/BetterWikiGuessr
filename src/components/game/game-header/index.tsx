"use client";

import YesterdayWord from "@/components/game/game-header/YesterdayWord";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { plural } from "@/utils/helper";
import Input from "./Input";

interface GameHeaderProps {
    date: string;
    percentage: number;
    won: boolean;
    hintsUsed: number;
    onSubmit: (e?: React.FormEvent) => void;
    coop?: boolean;
    input: string;
    setInput: (value: string) => void;
    guessCount: number;
    guessing: boolean;
    datas: string[];
}

export default function GameHeader({
    percentage,
    won,
    hintsUsed,
    onSubmit,
    input,
    setInput,
    guessCount,
    coop = false,
    datas,
    guessing,
}: GameHeaderProps) {
    const onInputChange = (value: string) => {
        setInput(value);
    };

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                    {coop && <Badge color="green">Co-op</Badge>}
                    {datas.map((value) => (
                        <span key={value}>
                            <span className="hidden sm:inline">· </span>
                            {value}
                        </span>
                    ))}
                    <span className="hidden sm:inline">
                        <YesterdayWord />
                    </span>
                </div>
                <div className="sm:hidden text-xs text-gray-500">
                    <YesterdayWord />
                </div>

                <ProgressBar percentage={percentage} />

                {won ? (
                    <div className="bg-emerald-50 border  border-emerald-300 rounded-lg p-3 text-center">
                        <p className="text-emerald-800 font-bold text-lg">
                            Bravo !
                            {` Trouvé en ${plural(guessCount, "essai", "essais")}${hintsUsed > 0 ? ` avec ${plural(hintsUsed, "indice", "indices")}` : ""} !`}
                        </p>
                    </div>
                ) : (
                    <Input
                        input={input}
                        onInputChange={onInputChange}
                        onSubmit={onSubmit}
                        guessing={guessing}
                    />
                )}
            </div>
        </div>
    );
}
