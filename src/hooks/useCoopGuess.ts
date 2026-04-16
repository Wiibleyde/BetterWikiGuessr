"use client";

import { useCallback, useState } from "react";
import { normalizeWord } from "@/lib/game/normalize";
import type { CoopGuessEntry } from "@/types/coop";
import type { WordPosition } from "@/types/game";
import { applyPositions } from "@/utils/helper";
import { useCoopState } from "./useCoopState";

export default function useCoopGuess(code: string | null) {
    const [input, setInput] = useState("");
    const {
        article,
        playerToken,
        guesses,
        won,
        setLobby,
        setGuesses,
        setRevealed,
        setWon,
    } = useCoopState();
    const [guessing, setGuessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitGuess = useCallback(
        async (e?: React.FormEvent) => {
            e?.preventDefault();
            if (
                !input.trim() ||
                !article ||
                !code ||
                !playerToken ||
                won ||
                guessing
            )
                return;

            const raw = input.trim();
            const normalized = normalizeWord(raw);

            if (guesses.some((g) => g.word === normalized)) {
                setInput("");
                return;
            }

            setGuessing(true);

            try {
                const res = await fetch(`/api/coop/${code}/guess`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ playerToken, word: raw }),
                });

                if (!res.ok) {
                    const data = (await res.json()) as { error: string };
                    setError(data.error);
                    return;
                }

                const result = (await res.json()) as {
                    guess?: CoopGuessEntry;
                    won: boolean;
                    found: boolean;
                    positions: CoopGuessEntry["positions"];
                    revealedPositions: WordPosition[];
                };

                if (result.guess) {
                    setGuesses((prev) => {
                        if (
                            prev.some(
                                (guess) =>
                                    guess.id === result.guess?.id ||
                                    guess.word === result.guess?.word,
                            )
                        ) {
                            return prev;
                        }

                        return [result.guess, ...prev];
                    });
                }

                if (result.won) {
                    setWon(true);
                    setLobby((prev) =>
                        prev
                            ? {
                                  ...prev,
                                  status: "finished",
                              }
                            : prev,
                    );
                }

                const positionsToReveal = result.won
                    ? result.revealedPositions
                    : result.positions;

                if (positionsToReveal.length > 0) {
                    setRevealed((prev) =>
                        applyPositions(prev, positionsToReveal),
                    );
                }
            } catch {
                setError("Erreur lors de la soumission");
            } finally {
                setGuessing(false);
                setInput("");
            }
        },
        [
            input,
            article,
            code,
            playerToken,
            won,
            guessing,
            guesses,
            setLobby,
            setGuesses,
            setRevealed,
            setWon,
        ],
    );

    return { input, setInput, submitGuess, guessing, error };
}
