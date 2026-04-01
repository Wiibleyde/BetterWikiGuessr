"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
    coopArticleAtom,
    coopErrorAtom,
    coopGuessesAtom,
    coopGuessingAtom,
    coopInputAtom,
    coopPlayerTokenAtom,
    coopRevealedAtom,
    coopWonAtom,
} from "@/atom/coop";
import { normalizeWord } from "@/lib/game/normalize";
import type { GuessResult } from "@/types/game";
import { applyPositions } from "@/utils/helper";

export default function useCoopGuess(code: string | null) {
    const [input, setInput] = useAtom(coopInputAtom);
    const article = useAtomValue(coopArticleAtom);
    const playerToken = useAtomValue(coopPlayerTokenAtom);
    const guesses = useAtomValue(coopGuessesAtom);
    const won = useAtomValue(coopWonAtom);
    const [guessing, setGuessing] = useAtom(coopGuessingAtom);
    const setRevealed = useSetAtom(coopRevealedAtom);
    const setError = useSetAtom(coopErrorAtom);

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

                // Broadcast will update guess list for all players.
                // We only update revealed map locally for instant article feedback.
                const result = (await res.json()) as GuessResult & {
                    won: boolean;
                };

                if (result.found && result.positions.length > 0) {
                    setRevealed((prev) =>
                        applyPositions(prev, result.positions),
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
            setGuessing,
            setRevealed,
            setError,
            setInput,
        ],
    );

    return { input, setInput, submitGuess, guessing };
}
