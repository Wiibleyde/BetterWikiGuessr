import { useEffect } from "react";
import useCoopLobby from "@/hooks/useCoopLobby";
import useCoopRealtime from "@/hooks/useCoopRealtime";
import CoopWaiting from "../coop/CoopWaiting";
import CoopMode from "../game/CoopMode";
import ErrorMessage from "../ui/Error";
import Loader from "../ui/Loader";

interface LobbyProps {
    code: string;
}

const Lobby = ({ code }: LobbyProps) => {
    const {
        loadState,
        startGame,
        error,
        loading,
        lobby,
        players,
        article,
        setPlayerToken,
        isLeader,
        setIsLeader,
    } = useCoopLobby();

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
};

export default Lobby;
