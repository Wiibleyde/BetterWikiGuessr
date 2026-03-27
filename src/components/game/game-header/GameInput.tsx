import type React from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface InputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
    guessing: boolean;
}

export default function GameInput({
    input,
    onInputChange,
    onSubmit,
    guessing,
}: InputProps) {
    return (
        <form onSubmit={onSubmit} className="flex gap-2">
            <Input
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                readOnly={guessing}
                placeholder="Devinez un mot…"
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
