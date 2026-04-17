import { WIKI_API } from "@/constants/wiki";
import type {
    ArticleApiResponse,
    ImageApiResponse,
    PageData,
    RandomPageResponse,
} from "@/types/wiki";
import { fetchWikiPagePart } from "@/utils/fetcher";

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
