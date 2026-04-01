import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import useCoopLobby from "@/hooks/useCoopLobby";
import useCoopRealtime from "@/hooks/useCoopRealtime";
import {
    clearCoopSession,
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
    const router = useRouter();
    const {
        loadState,
        startGame,
        joinLobby,
        error,
        loading,
        lobby,
        players,
        article,
        setPlayerToken,
        isLeader,
        setIsLeader,
        resetState,
    } = useCoopLobby();

    const [hasSession, setHasSession] = useState<boolean | null>(null);

    // Reset all coop atoms and check session for this specific code
    useEffect(() => {
        resetState();
        if (!code) return;
        const token = getCoopToken(code);
        if (token) {
            setPlayerToken(token);
            setHasSession(true);
        } else {
            setHasSession(false);
        }
    }, [code, resetState, setPlayerToken]);

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

    const handleLeave = () => {
        clearCoopSession(code);
        resetState();
        router.push("/coop");
    };

    // Still checking sessionStorage
    if (hasSession === null) {
        return <Loader message="Chargement du lobby…" />;
    }

    // No session — show join form
    if (!hasSession) {
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
                onLeave={handleLeave}
            />
        );
    }

    return <CoopMode code={code} onLeave={handleLeave} />;
};

export default Lobby;
