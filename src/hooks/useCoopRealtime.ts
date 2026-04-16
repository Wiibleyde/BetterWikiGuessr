"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CoopGuessEntry, CoopPlayerInfo } from "@/types/coop";
import type { MaskedArticle, WordPosition } from "@/types/game";
import { applyPositions } from "@/utils/helper";
import { useCoopState } from "./useCoopState";

export default function useCoopRealtime(code: string | null) {
    const {
        setPlayers,
        setArticle,
        setGuesses,
        setLobby,
        setWon,
        setRevealed,
    } = useCoopState();
    const channelRef = useRef<ReturnType<
        NonNullable<ReturnType<typeof getSupabaseBrowserClient>>["channel"]
    > | null>(null);

    useEffect(() => {
        if (!code) return;

        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        const channel = supabase.channel(`coop:${code}`);
        channelRef.current = channel;

        channel
            .on("broadcast", { event: "player_joined" }, ({ payload }) => {
                const { playerId, displayName } = payload as {
                    playerId: number;
                    displayName: string;
                };
                setPlayers((prev: CoopPlayerInfo[]) => {
                    if (prev.some((p) => p.id === playerId)) return prev;
                    return [
                        ...prev,
                        {
                            id: playerId,
                            displayName,
                            isLeader: false,
                            guessCount: 0,
                        },
                    ];
                });
            })
            .on("broadcast", { event: "player_left" }, ({ payload }) => {
                const { playerId } = payload as {
                    playerId: number;
                    displayName: string;
                };
                setPlayers((prev: CoopPlayerInfo[]) =>
                    prev.filter((p) => p.id !== playerId),
                );
            })
            .on("broadcast", { event: "leader_changed" }, ({ payload }) => {
                const { newLeaderId } = payload as {
                    newLeaderId: number;
                    displayName: string;
                };
                setPlayers((prev: CoopPlayerInfo[]) =>
                    prev.map((p) => ({
                        ...p,
                        isLeader: p.id === newLeaderId,
                    })),
                );
            })
            .on("broadcast", { event: "game_started" }, ({ payload }) => {
                const { article } = payload as { article: MaskedArticle };
                setLobby((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: "playing",
                          }
                        : prev,
                );
                setArticle(article);
            })
            .on("broadcast", { event: "guess_result" }, ({ payload }) => {
                const { guess } = payload as { guess: CoopGuessEntry };
                setGuesses((prev: CoopGuessEntry[]) => {
                    if (
                        prev.some(
                            (entry) =>
                                entry.id === guess.id ||
                                entry.word === guess.word,
                        )
                    ) {
                        return prev;
                    }

                    return [guess, ...prev];
                });

                if (guess.found && guess.positions.length > 0) {
                    setRevealed((prev) =>
                        applyPositions(prev, guess.positions),
                    );
                }

                setPlayers((prev: CoopPlayerInfo[]) =>
                    prev.map((p) =>
                        p.id === guess.player?.id
                            ? { ...p, guessCount: p.guessCount + 1 }
                            : p,
                    ),
                );
            })
            .on("broadcast", { event: "game_won" }, ({ payload }) => {
                const { positions } = payload as { positions: WordPosition[] };
                setLobby((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: "finished",
                          }
                        : prev,
                );
                if (positions.length > 0) {
                    setRevealed((prev) => applyPositions(prev, positions));
                }
                setWon(true);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [
        code,
        setPlayers,
        setArticle,
        setGuesses,
        setLobby,
        setWon,
        setRevealed,
    ]);
}
