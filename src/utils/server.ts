import axios from "axios";
import type { GameCache, GameStateResponse } from "@/types/game";

/** Push current game state to the server (fire-and-forget). */
export async function pushStateToServer(cache: GameCache): Promise<boolean> {
    try {
        const response = await axios.put("/api/game/state", cache, {
            validateStatus: () => true,
        });
        return response.status >= 200 && response.status < 300;
    } catch {
        console.error("[sync] failed to push state to server");
        return false;
    }
}

/** Fetch the saved game state from the server. */
export async function fetchStateFromServer(): Promise<GameCache | null> {
    try {
        const response = await axios.get<GameStateResponse>("/api/game/state", {
            validateStatus: () => true,
        });
        if (response.status < 200 || response.status >= 300) return null;
        return response.data.state;
    } catch {
        console.error("[sync] failed to fetch state from server");
        return null;
    }
}
