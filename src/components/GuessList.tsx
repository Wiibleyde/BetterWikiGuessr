"use client";

import type { StoredGuess } from "@/types/game";

interface GuessListProps {
    guesses: StoredGuess[];
}

export default function GuessList({ guesses }: GuessListProps) {
    return (
        <aside className="lg:w-72 w-full shrink-0">
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
                        guesses.map((g, i) => {
                            const isClose =
                                !g.found && (g.similarity ?? 0) >= 0.55;
                            return (
                                <div
                                    key={`${g.word}-${i}`}
                                    className={[
                                        "flex items-center justify-between px-4 py-1.5 text-sm",
                                        g.found
                                            ? "bg-emerald-50/60"
                                            : isClose
                                              ? "bg-amber-50/60"
                                              : "bg-red-50/60",
                                    ].join(" ")}
                                >
                                    <span
                                        className={
                                            g.found
                                                ? "text-emerald-800"
                                                : isClose
                                                  ? "text-amber-700"
                                                  : "text-red-400 line-through"
                                        }
                                    >
                                        {g.word}
                                    </span>
                                    {g.found && (
                                        <span className="text-emerald-600 font-mono text-xs">
                                            ×{g.occurrences}
                                        </span>
                                    )}
                                    {isClose && (
                                        <span className="text-amber-500 font-mono text-xs">
                                            ~
                                            {Math.round(
                                                (g.similarity ?? 0) * 100,
                                            )}
                                            %
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </aside>
    );
}
