"use client";

import Button from "@/components/ui/Button";
import { plural } from "@/utils/helper";

interface CoopGameHeaderProps {
    percentage: number;
    won: boolean;
    guessCount: number;
    playerCount: number;
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
    guessing: boolean;
}

export default function CoopGameHeader({
    percentage,
    won,
    guessCount,
    playerCount,
    input,
    onInputChange,
    onSubmit,
    guessing,
}: CoopGameHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 flex-wrap">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        Co-op
                    </span>
                    <span>·</span>
                    <span>{plural(playerCount, "joueur", "joueurs")}</span>
                    <span>·</span>
                    <span>{plural(guessCount, "essai", "essais")}</span>
                    <span>·</span>
                    <span>{plural(percentage, "% révélé", "% révélés")}</span>
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
                            {` Trouvé en ${plural(guessCount, "essai", "essais")} avec ${plural(playerCount, "joueur", "joueurs")} !`}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder="Devinez un mot…"
                            disabled={guessing}
                            className="min-w-0 flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <Button
                            type="submit"
                            disabled={guessing || !input.trim()}
                        >
                            {guessing ? "…" : "Deviner"}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
