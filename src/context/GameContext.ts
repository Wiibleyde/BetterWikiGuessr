"use client";

import { createContext, type Dispatch, type SetStateAction } from "react";
import type { MaskedArticle, RevealedMap, StoredGuess } from "@/types/game";

export interface GameContextValue {
    article: MaskedArticle | null;
    setArticle: Dispatch<SetStateAction<MaskedArticle | null>>;
    guesses: StoredGuess[];
    setGuesses: Dispatch<SetStateAction<StoredGuess[]>>;
    revealed: RevealedMap;
    setRevealed: Dispatch<SetStateAction<RevealedMap>>;
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    won: boolean;
    setWon: Dispatch<SetStateAction<boolean>>;
    saved: boolean;
    setSaved: Dispatch<SetStateAction<boolean>>;
    error: string | null;
    setError: Dispatch<SetStateAction<string | null>>;
    synced: boolean;
    setSynced: Dispatch<SetStateAction<boolean>>;
    revealedImages: string[];
    setRevealedImages: Dispatch<SetStateAction<string[]>>;
    winImages: string[];
    setWinImages: Dispatch<SetStateAction<string[]>>;
    yesterday: string | null;
    setYesterday: Dispatch<SetStateAction<string | null>>;
}

const GameContext = createContext<GameContextValue | null>(null);

export default GameContext;
