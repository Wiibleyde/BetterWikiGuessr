import type { PageData, WikiPage } from "@/types/wiki";
import { fetchImageUrls, fetchPageData, fetchRandomTitle } from "../query/wiki";
import { filterGenericImages, parseWikiSections } from "./wiki-parser";

function toWikiUrl(title: string, fullurl?: string): string {
    return (
        fullurl ?? `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`
    );
}

function createWikiPage(
    title: string,
    content: string,
    page: PageData,
    imageUrls: string[],
): WikiPage {
    return {
        title,
        url: toWikiUrl(title, page.fullurl),
        images: filterGenericImages(imageUrls),
        sections: parseWikiSections(content, title),
    };
}

export async function fetchRandomWikiPage(
    minContentLength = 1000,
    maxAttempts = 25,
): Promise<WikiPage> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const title = await fetchRandomTitle();
            if (!title) continue;

            const page = await fetchPageData(title);
            const content = page?.extract ?? "";
            if (!page || content.length < minContentLength) continue;

            const imageTitles =
                page.images?.map((img: { title: string }) => img.title) ?? [];
            const imageUrls = await fetchImageUrls(imageTitles);

            return createWikiPage(title, content, page, imageUrls);
        } catch (error) {
            console.error(`[wiki] Tentative ${attempt}/${maxAttempts}:`, error);
        }
    }

    throw new Error(
        `Impossible de trouver une page ≥ ${minContentLength} car. après ${maxAttempts} tentatives`,
    );
}
