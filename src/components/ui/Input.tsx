import type React from "react";

interface InputProps {
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: (e?: React.FormEvent) => void;
}

const Input = ({ input, onInputChange, onSubmit }: InputProps) => {
    return (
        <form onSubmit={onSubmit} className="flex gap-2">
            <input
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Devinez un mot…"
                className={
                    "min-w-0 flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                }
            />
            <button
                type="submit"
                disabled={!input.trim()}
                className="shrink-0 px-4 sm:px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {"Deviner"}
            </button>
        </form>
    );
};

export default Input;
