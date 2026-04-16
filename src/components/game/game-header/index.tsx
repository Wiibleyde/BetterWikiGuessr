"use client";

import YesterdayWord from "@/components/game/game-header/YesterdayWord";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { plural } from "@/utils/helper";
import GameInput from "./GameInput";

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
    coop,
    datas,
    guessing,
}: GameHeaderProps) {
    const onInputChange = (value: string) => {
        setInput(value);
    };

    return (
        <div className="bg-surface border-b border-border">
            <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted flex-wrap">
                    {coop && <Badge color="green">Co-op</Badge>}
                    {datas.map((value) => {
                        const isFirst = datas[0] === value;
                        return (
                            <span key={value}>
                                <span className="hidden sm:inline">
                                    {!isFirst && (
                                        <span className="text-muted">· </span>
                                    )}{" "}
                                </span>
                                {value}
                            </span>
                        );
                    })}
                    {!coop && (
                        <span className="hidden sm:inline">
                            <YesterdayWord />
                        </span>
                    )}
                </div>
                {!coop && (
                    <div className="sm:hidden text-xs text-muted">
                        <YesterdayWord />
                    </div>
                )}

                <ProgressBar percentage={percentage} />

                {won ? (
                    <div
                        className="bg-success-light border border-success/30 rounded-xl p-3 text-center"
                        aria-live="polite"
                    >
                        <p className="text-success-text font-bold text-lg font-(family-name:--font-heading)">
                            Bravo !
                            {` Trouvé en ${plural(guessCount, "essai", "essais")}${hintsUsed > 0 ? ` avec ${plural(hintsUsed, "indice", "indices")}` : ""} !`}
                        </p>
                    </div>
                ) : (
                    <GameInput
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
