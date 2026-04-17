"use client";

import { useCallback, useState } from "react";
import { computeRevealPercentage } from "@/lib/game/progress";
import type { CoopJoinResponse, CoopLobbyState } from "@/types/coop";
import { applyPositions } from "@/utils/helper";
import { useCoopState } from "./useCoopState";

export default function useCoopLobby() {
    const {
        lobby,
        setLobby,
        players,
        setPlayers,
        article,
        setArticle,
        setGuesses,
        revealed,
        setRevealed,
        setWon,
        playerToken,
        setPlayerToken,
    } = useCoopState();
    const [isLeader, setIsLeader] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetState = useCallback(() => {
        setLobby(null);
        setPlayers([]);
        setArticle(null);
        setGuesses([]);
        setRevealed({});
        setWon(false);
        setPlayerToken(null);
        setIsLeader(false);
        setLoading(false);
        setError(null);
    }, [
        setLobby,
        setPlayers,
        setArticle,
        setGuesses,
        setRevealed,
        setWon,
        setPlayerToken,
    ]);

    const percentage = computeRevealPercentage(revealed, article);

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
        [setPlayerToken],
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
                // setPlayerId(join.playerId);
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
        [setPlayerToken],
    );

    const loadState = useCallback(
        async (code: string, options?: { silent?: boolean }) => {
            if (!options?.silent) {
                setLoading(true);
            }
            try {
                const res = await fetch(`/api/coop/${code}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError("Ce lobby n'existe plus");
                    }
                    return;
                }
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
        [setLobby, setPlayers, setGuesses, setArticle, setRevealed, setWon],
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
    }, [lobby, playerToken, setLobby, setArticle]);

    return {
        lobby,
        players,
        playerToken,
        loading,
        error,
        percentage,
        createLobby,
        joinLobby,
        loadState,
        startGame,
        article,
        setPlayerToken,
        isLeader,
        setIsLeader,
        resetState,
    };
}
