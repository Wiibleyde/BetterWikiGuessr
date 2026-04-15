"use client";

import { useGameState } from "@/hooks/useGameState";

export default function YesterdayWord() {
    const { yesterday: title } = useGameState();

    if (!title) return null;

    return (
        <span className="text-sm text-muted">
            Hier : <span className="font-medium text-text">{title}</span>
        </span>
    );
}
