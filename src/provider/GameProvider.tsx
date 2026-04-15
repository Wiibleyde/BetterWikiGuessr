"use client";

import { type ReactNode, useState } from "react";
import GameContext from "@/context/GameContext";
import type { MaskedArticle, RevealedMap, StoredGuess } from "@/types/game";

interface GameProviderProps {
    children: ReactNode;
}

const GameProvider = ({ children }: GameProviderProps) => {
    const [article, setArticle] = useState<MaskedArticle | null>(null);
    const [guesses, setGuesses] = useState<StoredGuess[]>([]);
    const [revealed, setRevealed] = useState<RevealedMap>({});
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [won, setWon] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [synced, setSynced] = useState(false);
    const [revealedImages, setRevealedImages] = useState<string[]>([]);
    const [winImages, setWinImages] = useState<string[]>([]);
    const [yesterday, setYesterday] = useState<string | null>(null);

    return (
        <GameContext.Provider
            value={{
                article,
                setArticle,
                guesses,
                setGuesses,
                revealed,
                setRevealed,
                input,
                setInput,
                loading,
                setLoading,
                won,
                setWon,
                saved,
                setSaved,
                error,
                setError,
                synced,
                setSynced,
                revealedImages,
                setRevealedImages,
                winImages,
                setWinImages,
                yesterday,
                setYesterday,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

export default GameProvider;
