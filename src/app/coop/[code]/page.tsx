"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import {
    coopArticleAtom,
    coopIsLeaderAtom,
    coopLoadingAtom,
    coopLobbyAtom,
    coopPlayersAtom,
    coopPlayerTokenAtom,
} from "@/atom/coop";
import CoopWaiting from "@/components/coop/CoopWaiting";
import CoopMode from "@/components/game/CoopMode";
import ErrorMessage from "@/components/ui/Error";
import Loader from "@/components/ui/Loader";
import useCoopLobby from "@/hooks/useCoopLobby";
import useCoopRealtime from "@/hooks/useCoopRealtime";

export default function CoopLobbyPage() {
    const params = useParams<{ code: string }>();
    const code = params.code;

    const lobby = useAtomValue(coopLobbyAtom);
    const players = useAtomValue(coopPlayersAtom);
    const article = useAtomValue(coopArticleAtom);
    const loading = useAtomValue(coopLoadingAtom);
    const isLeader = useAtomValue(coopIsLeaderAtom);
    const setPlayerToken = useSetAtom(coopPlayerTokenAtom);
    const setIsLeader = useSetAtom(coopIsLeaderAtom);

    const { loadState, startGame, error } = useCoopLobby();

    // Restore session tokens
    useEffect(() => {
        if (!code) return;
        const token = sessionStorage.getItem(`coop:${code}:token`);
        if (token) setPlayerToken(token);
    }, [code, setPlayerToken]);

    // Load lobby state
    useEffect(() => {
        if (code) loadState(code);
    }, [code, loadState]);

    // One-shot reconciliation for clients joining during a transition.
    useEffect(() => {
        if (!code) return;

        const timeout = window.setTimeout(() => {
            loadState(code, { silent: true });
        }, 1200);

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                loadState(code, { silent: true });
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearTimeout(timeout);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [code, loadState]);

    // Detect leader from loaded players
    useEffect(() => {
        const storedId = sessionStorage.getItem(`coop:${code}:playerId`);
        if (storedId && players.length > 0) {
            const me = players.find((p) => p.id === Number(storedId));
            if (me?.isLeader) setIsLeader(true);
        }
    }, [code, players, setIsLeader]);

    // Subscribe to realtime
    useCoopRealtime(code);

    if (loading && !lobby) {
        return <Loader message="Chargement du lobby…" />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    const status = lobby?.status ?? "waiting";

    if (status === "waiting" || (!article && status !== "finished")) {
        return (
            <CoopWaiting
                code={code}
                players={players}
                isLeader={isLeader}
                loading={loading}
                onStart={startGame}
            />
        );
    }

    return <CoopMode code={code} />;
}
