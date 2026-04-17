import axios from "axios";
import type { ProfileStats } from "@/types/auth";
import type {
    GameCache,
    GameStateResponse,
    GuessResult,
    HintResponse,
    MaskedArticle,
    RevealResponse,
} from "@/types/game";
import type { PageEntry } from "@/types/historic";
import type { LeaderboardCategoryData } from "@/types/leaderboard";
import { fetcher } from "@/utils/fetcher";

export const fetchImageHint = async (
    hintIndex: number,
    guesses?: string[],
    won?: boolean,
): Promise<HintResponse | undefined> => {
    try {
        const data = await fetcher<HintResponse>("/api/game/hint", {
            method: "POST",
            body: { hintIndex, guesses, won },
            validateStatus: () => true,
        });
        return data;
    } catch {
        // skip failed image
    }
};

export const fetchGameReveal = async (
    words: string[],
): Promise<RevealResponse | undefined> => {
    try {
        const data = await fetcher<RevealResponse>("/api/game/reveal", {
            method: "POST",
            body: { words },
            validateStatus: () => true,
        });
        return data;
    } catch {
        console.error("[reveal] failed to reveal all words");
    }
};

export const checkGameGuess = async (
    word: string,
    revealedWords: string[],
): Promise<GuessResult | undefined> => {
    try {
        const result = await fetcher<GuessResult>("/api/game/guess", {
            method: "POST",
            body: { word, revealedWords },
            validateStatus: () => true,
        });
        return result;
    } catch {
        console.error("[guess] failed to submit guess");
        return undefined;
    }
};

export const fetchGame = async (): Promise<MaskedArticle | null> => {
    try {
        const data = await fetcher<MaskedArticle>("/api/game");
        return data;
    } catch (err) {
        console.error("[fetchGame]", err);
        return null;
    }
};

export const fetchYesterdayWord = async (): Promise<string | null> => {
    try {
        const data = await fetcher<{ title: string | null }>(
            "/api/game/yesterday",
        );
        return data.title;
    } catch (err) {
        console.error("[fetchYesterdayWord]", err);
        return null;
    }
};

export const fetchLeaderboard = async (): Promise<
    LeaderboardCategoryData[] | null
> => {
    try {
        const data = await fetcher<{
            categories: LeaderboardCategoryData[];
        }>("/api/leaderboard");
        return data.categories;
    } catch (err) {
        console.error("[fetchLeaderboard]", err);
        return null;
    }
};

export const fetchHistoric = async (): Promise<PageEntry[] | null> => {
    try {
        const data = await fetcher<PageEntry[]>("/api/historic");
        return data;
    } catch (err) {
        console.error("[fetchHistoric]", err);
        return null;
    }
};

export const fetchProfileStats = async (
    userId: string,
): Promise<ProfileStats | null> => {
    try {
        const data = await fetcher<ProfileStats>(
            `/api/profile/stats?userId=${userId}`,
        );
        return data;
    } catch (err) {
        console.error("[fetchProfileStats]", err);
        return null;
    }
};

/** Push current game state to server (fire-and-forget). */
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

/** Fetch saved game state from server. */
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
