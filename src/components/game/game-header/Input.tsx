import { useAtomValue } from "jotai";
import type React from "react";
import {
    guessingAtom,
    lastGuessFoundAtom,
    lastGuessSimilarityAtom,
} from "@/atom/game";
import Button from "@/components/ui/Button";
import { CLOSE_THRESHOLD } from "@/constants/game";

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
            <Button
                variant="primary"
                disabled={guessing || !input.trim()}
                className="shrink-0 px-4 sm:px-5"
            >
                {guessing ? "…" : "Deviner"}
            </Button>
        </form>
    );
}
