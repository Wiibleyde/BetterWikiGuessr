"use client";

import type { StoredGuess } from "@/types/game";
import Guess from "./Guess";

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
                        guesses.map((guess, i) => (
                            <Guess key={`${guess.word}-${i}`} guess={guess} />
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
