import { WIKI_API } from "@/constants/wiki";
import type { ProfileStats } from "@/types/auth";
import type {
    GuessResult,
    HintResponse,
    MaskedArticle,
    RevealResponse,
} from "@/types/game";
import type { PageEntry } from "@/types/historic";
import type { LeaderboardCategoryData } from "@/types/leaderboard";
import type {
    ArticleApiResponse,
    ImageApiResponse,
    PageData,
    RandomPageResponse,
} from "@/types/wiki";
import { fetcher, fetchWikiPagePart } from "@/utils/fetcher";

export async function fetchRandomTitle(): Promise<string | undefined> {
    const data = await fetchWikiPagePart<RandomPageResponse>(
        `${WIKI_API}?action=query&format=json&list=random&rnnamespace=0&rnlimit=1`,
    );
    return data.query?.random?.[0]?.title;
}

export async function fetchPageData(
    title: string,
): Promise<PageData | undefined> {
    const data = await fetchWikiPagePart<ArticleApiResponse>(
        `${WIKI_API}?action=query&format=json&titles=${encodeURIComponent(title)}&prop=extracts|images|info&inprop=url&explaintext=true&imlimit=500`,
    );
    const pages = data.query?.pages;
    if (!pages) return undefined;
    return Object.values(pages)[0];
}

export async function fetchImageUrls(imageTitles: string[]): Promise<string[]> {
    if (imageTitles.length === 0) return [];

    const data = await fetchWikiPagePart<ImageApiResponse>(
        `${WIKI_API}?action=query&format=json&titles=${encodeURIComponent(imageTitles.join("|"))}&prop=imageinfo&iiprop=url`,
    );

    return Object.values(data.query?.pages ?? {})
        .map((p) => p.imageinfo?.[0]?.url)
        .filter((url): url is string => !!url);
}

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
