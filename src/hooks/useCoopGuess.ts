"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
    coopArticleAtom,
    coopErrorAtom,
    coopGuessingAtom,
    coopInputAtom,
    coopPlayerTokenAtom,
    coopRevealedAtom,
    coopWonAtom,
} from "@/atom/coop";
import type { GuessResult } from "@/types/game";
import { posKey } from "@/utils/helper";

export default function useCoopGuess(code: string | null) {
    const [input, setInput] = useAtom(coopInputAtom);
    const article = useAtomValue(coopArticleAtom);
    const playerToken = useAtomValue(coopPlayerTokenAtom);
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
                    setRevealed((prev) => {
                        const next = { ...prev };
                        for (const pos of result.positions) {
                            next[posKey(pos.section, pos.part, pos.wordIndex)] =
                                pos.display;
                        }
                        return next;
                    });
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
            setGuessing,
            setRevealed,
            setError,
            setInput,
        ],
    );

    return { input, setInput, submitGuess, guessing };
}
