"use client";

import YesterdayWord from "@/components/YesterdayWord";
import { plural } from "@/utils/plural";

interface GameHeaderProps {
    date: string;
    guessCount: number;
    percentage: number;
    won: boolean;
    guessing: boolean;
    input: string;
    lastGuessFound: boolean | null;
    lastGuessSimilarity: number;
    hintsUsed: number;
    score: number;
    onInputChange: (value: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
}

export default function GameHeader({
    date,
    guessCount,
    percentage,
    won,
    guessing,
    input,
    lastGuessFound,
    lastGuessSimilarity,
    hintsUsed,
    score,
    onInputChange,
    onSubmit,
}: GameHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                    <span>{date}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>
                        {plural(guessCount, "essai", "essais")}
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
                    <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-center">
                        <p className="text-emerald-800 font-bold text-lg">
                            Bravo !
                            {hintsUsed > 0
                                ? ` Score : ${score} (${plural(guessCount, "essai", "essais")} + ${plural(hintsUsed, "indice", "indices")})`
                                : ` Trouvé en ${plural(guessCount, "essai", "essais")} !`}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder="Devinez un mot…"
                            className={[
                                "min-w-0 flex-1 px-3 sm:px-4 py-2 border rounded-lg text-sm transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-blue-400",
                                lastGuessFound === false &&
                                lastGuessSimilarity >= 0.65
                                    ? "border-amber-400 bg-amber-50"
                                    : lastGuessFound === false
                                      ? "border-red-300 bg-red-50"
                                      : lastGuessFound === true
                                        ? "border-emerald-300 bg-emerald-50"
                                        : "border-gray-300",
                            ].join(" ")}
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
