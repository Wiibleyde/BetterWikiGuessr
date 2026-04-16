import { useMutation, useQuery } from "@tanstack/react-query";
import {
    checkGameGuess,
    fetchGame,
    fetchGameReveal,
    fetchHistoric,
    fetchImageHint,
    fetchLeaderboard,
    fetchProfileStats,
    fetchYesterdayWord,
} from "./queries";

/** Fetch the current masked game article */
export const useFetchGame = (enabled = true) => {
    return useQuery({
        queryKey: ["game"],
        queryFn: () => fetchGame(),
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    });
};

/** Fetch yesterday's game title */
export const useFetchYesterdayWord = (enabled = true) => {
    return useQuery({
        queryKey: ["yesterdayWord"],
        queryFn: () => fetchYesterdayWord(),
        enabled,
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
};

/** Fetch image hint for a specific index */
export const useFetchImageHint = (
    hintIndex: number,
    guesses?: string[],
    won?: boolean,
) => {
    return useQuery({
        queryKey: ["gameHint", hintIndex, guesses, won],
        queryFn: () => fetchImageHint(hintIndex, guesses, won),
        staleTime: Infinity, // hints don't change
        gcTime: 1000 * 60 * 60, // 1 hour
    });
};

/** Mutation for submitting a guess */
export const useSubmitGuess = () => {
    return useMutation({
        mutationFn: ({
            word,
            revealedWords,
        }: {
            word: string;
            revealedWords: string[];
        }) => checkGameGuess(word, revealedWords),
    });
};

/** Mutation for revealing all words after winning */
export const useRevealAllWords = () => {
    return useMutation({
        mutationFn: (words: string[]) => fetchGameReveal(words),
    });
};

/** Fetch leaderboard data */
export const useFetchLeaderboard = (enabled = true) => {
    return useQuery({
        queryKey: ["leaderboard"],
        queryFn: () => fetchLeaderboard(),
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
};

/** Fetch historic pages */
export const useFetchHistoric = (enabled = true) => {
    return useQuery({
        queryKey: ["historic"],
        queryFn: () => fetchHistoric(),
        enabled,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
};

/** Fetch user profile stats */
export const useFetchProfileStats = (userId: string, enabled = true) => {
    return useQuery({
        queryKey: ["profileStats", userId],
        queryFn: () => fetchProfileStats(userId),
        enabled: enabled && !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
};
