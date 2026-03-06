import axios from "axios";
import type {
    GuessResult,
    HintResponse,
    MaskedArticle,
    RevealResponse,
} from "@/types/game";

export const fetchImageHint = async (
    hintIndex: number,
    guesses?: string[],
    won?: boolean,
): Promise<HintResponse | undefined> => {
    try {
        const response = await axios.post<HintResponse>(
            "/api/game/hint",
            { hintIndex, guesses, won },
            { validateStatus: () => true },
        );
        if (response.status < 200 || response.status >= 300) return undefined;
        const data = response.data;
        return data;
    } catch {
        // skip failed image
    }
};

export const fetchGameReveal = async (
    words: string[],
): Promise<RevealResponse | undefined> => {
    try {
        const response = await axios.post<RevealResponse>(
            "/api/game/reveal",
            { words },
            { validateStatus: () => true },
        );
        if (response.status < 200 || response.status >= 300) return undefined;
        return response.data;
    } catch {
        console.error("[reveal] failed to reveal all words");
    }
};

export const checkGameGuess = async (
    word: string,
    revealedWords: string[],
): Promise<GuessResult | undefined> => {
    try {
        const response = await axios.post<GuessResult>(
            "/api/game/guess",
            {
                word,
                revealedWords,
            },
            { validateStatus: () => true },
        );

        if (response.status < 200 || response.status >= 300) {
            throw new Error("Erreur serveur");
        }

        const result = response.data;
        return result;
    } catch {
        console.error("[guess] failed to submit guess");
        return undefined;
    }
};

export const fetchGame = async (): Promise<MaskedArticle | null> => {
    try {
        const response = await axios.get<MaskedArticle>("/api/game");
        if (response.status < 200 || response.status >= 300) {
            throw new Error("Erreur serveur");
        }
        return response.data;
    } catch (err) {
        console.error("[fetchGame]", err);
        return null;
    }
};
