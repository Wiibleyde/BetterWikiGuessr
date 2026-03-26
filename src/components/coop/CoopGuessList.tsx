"use client";

import type { CoopGuessEntry, CoopPlayerInfo } from "@/types/coop";

const PLAYER_COLORS = [
    "text-blue-600",
    "text-emerald-600",
    "text-amber-600",
    "text-purple-600",
];

interface CoopGuessListProps {
    guesses: CoopGuessEntry[];
    players: CoopPlayerInfo[];
}

export default function CoopGuessList({
    guesses,
    players,
}: CoopGuessListProps) {
    const playerColorMap = new Map<number, string>();
    for (const [i, player] of players.entries()) {
        playerColorMap.set(player.id, PLAYER_COLORS[i % PLAYER_COLORS.length]);
    }

    return (
        <aside className="lg:w-80 w-full shrink-0">
            <div className="sticky top-36 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                    Essais ({guesses.length})
                </div>
                <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
                    {guesses.length === 0 ? (
                        <p className="p-4 text-center text-gray-400 text-xs">
                            Aucun essai
                        </p>
                    ) : (
                        guesses.map((guess) => (
                            <div
                                key={guess.id}
                                className="px-3 py-2 flex items-center gap-2"
                            >
                                <span
                                    className={`text-xs font-medium shrink-0 ${playerColorMap.get(guess.player.id) ?? "text-gray-500"}`}
                                >
                                    {guess.player.displayName}
                                </span>
                                <span
                                    className={`text-sm font-medium truncate ${
                                        guess.found
                                            ? "text-emerald-700"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {guess.word}
                                </span>
                                {guess.found && (
                                    <span className="ml-auto text-xs text-emerald-500 shrink-0">
                                        {guess.occurrences}
                                    </span>
                                )}
                                {!guess.found && guess.similarity > 0 && (
                                    <span className="ml-auto text-xs text-gray-400 shrink-0">
                                        {Math.round(guess.similarity * 100)}%
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
