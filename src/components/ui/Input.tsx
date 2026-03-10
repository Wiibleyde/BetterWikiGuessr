import { useAtomValue } from "jotai";
import type React from "react";
import {
    guessingAtom,
    lastGuessFoundAtom,
    lastGuessSimilarityAtom,
} from "@/atom/game";
import { CLOSE_THRESHOLD } from "@/lib/constants/game";

interface InputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
}

export default function Input({ input, onInputChange, onSubmit }: InputProps) {
    const lastGuessFound = useAtomValue(lastGuessFoundAtom);
    const lastGuessSimilarity = useAtomValue(lastGuessSimilarityAtom);
    const guessing = useAtomValue(guessingAtom);

    const inputClass = [
        "min-w-0 flex-1 px-3 sm:px-4 py-2 border rounded-lg text-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-400",
        lastGuessFound === false && lastGuessSimilarity >= CLOSE_THRESHOLD
            ? "border-amber-400 bg-amber-50"
            : lastGuessFound === false
              ? "border-red-300 bg-red-50"
              : lastGuessFound === true
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-300",
    ].join(" ");

    return (
        <form onSubmit={onSubmit} className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Devinez un mot…"
                className={inputClass}
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
    );
}
