import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import useCoopLobby from "@/hooks/useCoopLobby";
import useCoopRealtime from "@/hooks/useCoopRealtime";
import {
    getCoopPlayerId,
    getCoopToken,
    storeCoopSession,
} from "@/utils/coopSession";
import CoopJoinForm from "../coop/CoopJoinForm";
import CoopWaiting from "../coop/CoopWaiting";
import CoopMode from "../game/CoopMode";
import ErrorMessage from "../ui/Error";
import Loader from "../ui/Loader";

interface LobbyProps {
    code: string;
}

const Lobby = ({ code }: LobbyProps) => {
    const { user } = useAuth();
    const {
        loadState,
        startGame,
        joinLobby,
        error,
        loading,
        lobby,
        players,
        playerToken,
        article,
        setPlayerToken,
        isLeader,
        setIsLeader,
    } = useCoopLobby();

    const [hasSession, setHasSession] = useState<boolean | null>(null);

    // Restore session tokens
    useEffect(() => {
        if (!code) return;
        const token = getCoopToken(code);
        if (token) {
            setPlayerToken(token);
            setHasSession(true);
        } else {
            setHasSession(false);
        }
    }, [code, setPlayerToken]);

    // Load lobby state once we have a session
    useEffect(() => {
        if (code && hasSession) loadState(code);
    }, [code, hasSession, loadState]);

    // Detect leader from loaded players
    useEffect(() => {
        const storedId = getCoopPlayerId(code);
        if (storedId !== null && players.length > 0) {
            const me = players.find((p) => p.id === storedId);
            if (me?.isLeader) setIsLeader(true);
        }
    }, [code, players, setIsLeader]);

    // Subscribe to realtime
    useCoopRealtime(code);

    const handleJoin = async (displayName: string) => {
        const result = await joinLobby(code, displayName, user?.id);
        if (result) {
            storeCoopSession(result);
            setHasSession(true);
        }
    };

    // Still checking sessionStorage
    if (hasSession === null) {
        return <Loader message="Chargement du lobby…" />;
    }

    // No session — show join form
    if (!hasSession && !playerToken) {
        return (
            <CoopJoinForm
                code={code}
                loading={loading}
                error={error}
                onJoin={handleJoin}
            />
        );
    }

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
};

export default Lobby;
