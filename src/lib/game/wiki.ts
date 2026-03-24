import {
    GENERIC_IMAGE_PATTERNS,
    IGNORED_SECTIONS,
    WIKI_API,
} from "@/constants/wiki";
import type {
    ArticleApiResponse,
    ImageApiResponse,
    PageData,
    RandomPageResponse,
    WikiPage,
    WikiSection,
} from "@/types/wiki";
import { fetchWikiPagePart } from "@/utils/fetcher";

function limitTo2Paragraphs(
    text: string,
    maxChars = 500,
    maxParagraphs = 2,
): string {
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());

    if (paragraphs.length === 0) return "";

    const result: string[] = [];
    let totalLength = 0;

    for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        result.push(trimmed);
        totalLength += trimmed.length;

        if (totalLength >= maxChars || result.length >= maxParagraphs) {
            break;
        }
    }

    return result.join("\n\n");
}

function parseWikiSections(content: string, title: string): WikiSection[] {
    // split avec groupe capturant → [intro, titre1, corps1, titre2, corps2, ...]
    const parts = content.split(/^==\s*([^=]+?)\s*==\s*$/gm);
    const sections: WikiSection[] = [];

    const intro = parts[0].trim();
    if (intro) {
        sections.push({
            title: title,
            content: limitTo2Paragraphs(intro),
        });
    }

    for (let i = 1; i < parts.length - 1 && sections.length < 2; i += 2) {
        const title = parts[i].trim();
        const body = parts[i + 1].replace(/^=+[^=]+=+$/gm, "").trim();

        if (IGNORED_SECTIONS.some((s) => title.toLowerCase().includes(s)))
            continue;
        if (body.replace(/\s/g, "").length < 20) continue;

        sections.push({ title, content: limitTo2Paragraphs(body) });
    }

    return sections.length > 0
        ? sections
        : [{ title: title, content: content.trim() }];
}

/**
 * Filtre les images génériques (icônes, logos, SVG de maintenance, etc.)
 */
function filterGenericImages(imageUrls: string[]): string[] {
    return imageUrls.filter((url) => {
        const fileName = url.split("/").pop()?.toLowerCase() ?? "";
        return !GENERIC_IMAGE_PATTERNS.some((pattern) =>
            pattern.test(fileName),
        );
    });
}

async function fetchRandomTitle(): Promise<string | undefined> {
    const data = await fetchWikiPagePart<RandomPageResponse>(
        `${WIKI_API}?action=query&format=json&list=random&rnnamespace=0&rnlimit=1`,
    );
    return data.query?.random?.[0]?.title;
}

async function fetchPageData(title: string): Promise<PageData | undefined> {
    const data = await fetchWikiPagePart<ArticleApiResponse>(
        `${WIKI_API}?action=query&format=json&titles=${encodeURIComponent(title)}&prop=extracts|images|info&inprop=url&explaintext=true&imlimit=500`,
    );
    const pages = data.query?.pages;
    if (!pages) return undefined;
    return Object.values(pages)[0];
}

async function fetchImageUrls(imageTitles: string[]): Promise<string[]> {
    if (imageTitles.length === 0) return [];
    const data = await fetchWikiPagePart<ImageApiResponse>(
        `${WIKI_API}?action=query&format=json&titles=${encodeURIComponent(imageTitles.join("|"))}&prop=imageinfo&iiprop=url`,
    );
    return Object.values(data.query?.pages ?? {})
        .map((p) => p.imageinfo?.[0]?.url)
        .filter((url): url is string => !!url);
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

            return {
                title,
                url:
                    page.fullurl ??
                    `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`,
                images: filterGenericImages(imageUrls),
                sections: parseWikiSections(content, title),
            };
        } catch (error) {
            console.error(`[wiki] Tentative ${attempt}/${maxAttempts}:`, error);
        }
    }

    throw new Error(
        `Impossible de trouver une page ≥ ${minContentLength} car. après ${maxAttempts} tentatives`,
    );
}
