"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
    coopArticleAtom,
    coopErrorAtom,
    coopGuessesAtom,
    coopIsLeaderAtom,
    coopLoadingAtom,
    coopLobbyAtom,
    coopPlayerIdAtom,
    coopPlayersAtom,
    coopPlayerTokenAtom,
    coopRevealedAtom,
    coopWonAtom,
} from "@/atom/coop";
import type { CoopJoinResponse, CoopLobbyState } from "@/types/coop";
import { computeRevealPercentage } from "@/utils/game";
import { applyPositions } from "@/utils/helper";

export default function useCoopLobby() {
    const [lobby, setLobby] = useAtom(coopLobbyAtom);
    const setPlayers = useSetAtom(coopPlayersAtom);
    const setArticle = useSetAtom(coopArticleAtom);
    const setGuesses = useSetAtom(coopGuessesAtom);
    const setRevealed = useSetAtom(coopRevealedAtom);
    const setWon = useSetAtom(coopWonAtom);
    const [playerId, setPlayerId] = useAtom(coopPlayerIdAtom);
    const [playerToken, setPlayerToken] = useAtom(coopPlayerTokenAtom);
    const [isLeader, setIsLeader] = useAtom(coopIsLeaderAtom);
    const [loading, setLoading] = useAtom(coopLoadingAtom);
    const [error, setError] = useAtom(coopErrorAtom);
    const article = useAtomValue(coopArticleAtom);

    const percentage = computeRevealPercentage(
        useAtomValue(coopRevealedAtom),
        article,
    );

    const createLobby = useCallback(
        async (displayName: string, userId?: string) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/coop", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ displayName, userId }),
                });
                const data = (await res.json()) as
                    | CoopJoinResponse
                    | { error: string };
                if (!res.ok) {
                    setError((data as { error: string }).error);
                    return null;
                }
                const join = data as CoopJoinResponse;
                setPlayerId(join.playerId);
                setPlayerToken(join.playerToken);
                setIsLeader(join.isLeader);
                return join;
            } catch {
                setError("Erreur lors de la création du lobby");
                return null;
            } finally {
                setLoading(false);
            }
        },
        [setLoading, setError, setPlayerId, setPlayerToken, setIsLeader],
    );

    const joinLobby = useCallback(
        async (code: string, displayName: string, userId?: string) => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/coop/join", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, displayName, userId }),
                });
                const data = (await res.json()) as
                    | CoopJoinResponse
                    | { error: string };
                if (!res.ok) {
                    setError((data as { error: string }).error);
                    return null;
                }
                const join = data as CoopJoinResponse;
                setPlayerId(join.playerId);
                setPlayerToken(join.playerToken);
                setIsLeader(join.isLeader);
                return join;
            } catch {
                setError("Erreur lors de la connexion au lobby");
                return null;
            } finally {
                setLoading(false);
            }
        },
        [setLoading, setError, setPlayerId, setPlayerToken, setIsLeader],
    );

    const loadState = useCallback(
        async (code: string, options?: { silent?: boolean }) => {
            if (!options?.silent) {
                setLoading(true);
            }
            try {
                const res = await fetch(`/api/coop/${code}`);
                if (!res.ok) return;
                const data = (await res.json()) as CoopLobbyState;
                setLobby(data.lobby);
                setPlayers(data.players);
                setGuesses(data.guesses);
                if (data.article) setArticle(data.article);
                if (data.lobby.status === "finished") setWon(true);

                // Rebuild revealed map from guesses
                let revealed = {};
                for (const g of data.guesses) {
                    if (g.found) {
                        revealed = applyPositions(revealed, g.positions);
                    }
                }
                setRevealed(revealed);
            } catch {
                setError("Erreur lors du chargement du lobby");
            } finally {
                if (!options?.silent) {
                    setLoading(false);
                }
            }
        },
        [
            setLoading,
            setLobby,
            setPlayers,
            setGuesses,
            setArticle,
            setRevealed,
            setWon,
            setError,
        ],
    );

    const startGame = useCallback(async () => {
        if (!lobby || !playerToken) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/coop/${lobby.code}/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerToken }),
            });
            const data = (await res.json()) as
                | { article: CoopLobbyState["article"] }
                | { error: string };
            if (!res.ok) {
                setError((data as { error: string }).error);
                return;
            }

            const { article: nextArticle } = data as {
                article: CoopLobbyState["article"];
            };

            setLobby((prev) =>
                prev
                    ? {
                          ...prev,
                          status: "playing",
                      }
                    : prev,
            );
            if (nextArticle) {
                setArticle(nextArticle);
            }
        } catch {
            setError("Erreur lors du lancement de la partie");
        } finally {
            setLoading(false);
        }
    }, [lobby, playerToken, setLoading, setError, setLobby, setArticle]);

    return {
        lobby,
        playerId,
        playerToken,
        isLeader,
        loading,
        error,
        percentage,
        createLobby,
        joinLobby,
        loadState,
        startGame,
    };
}
