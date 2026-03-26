import type React from "react";
import Button from "@/components/ui/Button";

interface InputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
    guessing: boolean;
}

export default function Input({
    input,
    onInputChange,
    onSubmit,
    guessing,
}: InputProps) {
    return (
        <form onSubmit={onSubmit} className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Devinez un mot…"
                className="min-w-0 flex-1 px-3 sm:px-4 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 border-gray-300"
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
