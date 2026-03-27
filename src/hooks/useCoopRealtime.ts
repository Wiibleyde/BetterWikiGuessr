"use client";

import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
    coopArticleAtom,
    coopGuessesAtom,
    coopLobbyAtom,
    coopPlayersAtom,
    coopWonAtom,
} from "@/atom/coop";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CoopPlayerInfo } from "@/types/coop";
import type { MaskedArticle, StoredGuess } from "@/types/game";

export default function useCoopRealtime(code: string | null) {
    const setPlayers = useSetAtom(coopPlayersAtom);
    const setArticle = useSetAtom(coopArticleAtom);
    const setGuesses = useSetAtom(coopGuessesAtom);
    const setLobby = useSetAtom(coopLobbyAtom);
    const setWon = useSetAtom(coopWonAtom);
    const channelRef = useRef<ReturnType<
        ReturnType<typeof getSupabaseBrowserClient>["channel"]
    > | null>(null);

    useEffect(() => {
        if (!code) return;

        const supabase = getSupabaseBrowserClient();
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
                const { guess } = payload as { guess: StoredGuess };
                setGuesses((prev: StoredGuess[]) => {
                    return [guess, ...prev];
                });

                setPlayers((prev: CoopPlayerInfo[]) =>
                    prev.map((p) =>
                        p.id === guess.player?.id
                            ? { ...p, guessCount: p.guessCount + 1 }
                            : p,
                    ),
                );
            })
            .on("broadcast", { event: "game_won" }, () => {
                setLobby((prev) =>
                    prev
                        ? {
                              ...prev,
                              status: "finished",
                          }
                        : prev,
                );
                setWon(true);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [code, setPlayers, setArticle, setGuesses, setLobby, setWon]);
}
