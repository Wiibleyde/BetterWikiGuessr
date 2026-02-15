export interface WikiSection {
    title: string;
    content: string;
}

export interface WikiPage {
    title: string;
    images: string[];
    sections: WikiSection[];
}

interface RandomPageResponse {
    query: {
        random: { id: number; ns: number; title: string }[];
    };
}

interface ImageInfo {
    url: string;
}

interface ImagePage {
    imageinfo?: ImageInfo[];
}

interface PageData {
    extract?: string;
    images?: { title: string }[];
}

interface WikiApiResponse {
    query?: {
        pages: Record<string, PageData | ImagePage>;
    };
}

const IGNORED_SECTIONS = [
    "notes et références",
    "voir aussi",
    "bibliographie",
    "liens externes",
    "articles connexes",
    "sources",
    "références",
    "notes",
    "annexes",
    "lien externe",
    "portail",
];

const GENERIC_IMAGE_PATTERNS = [
    /icon/i,
    /logo/i,
    /arrow/i,
    /pencil/i,
    /flag/i,
    /symbol/i,
    /pictogram/i,
    /disambig/i,
    /info_simple/i,
    /circle-icons/i,
    /wikinews/i,
    /wikiquote/i,
    /wikisource/i,
    /wiktionary/i,
    /commons-logo/i,
    /question_book/i,
    /ambox/i,
    /merge/i,
    /split/i,
    /check/i,
    /cross/i,
    /x_mark/i,
    /green_check/i,
    /red_x/i,
    /gnu/i,
    /creative_commons/i,
    /cc-/i,
    /fair_use/i,
    /pd-icon/i,
    /copyrighted/i,
    /magnify/i,
    /folder/i,
    /portal/i,
    /commons_to_/i,
    /move_to_commons/i,
    /captain_sports/i,
    /football_shoe/i,
    /soccer/i,
    /soccerball/i,
    /red_card/i,
    /yellow_card/i,
    /sub_off/i,
    /sub_on/i,
    /card\.svg/i,
    /ball.*\.svg/i,
    /go-next/i,
    /go-previous/i,
    /righthand/i,
    /lefthand/i,
    /\.svg$/i,
];

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

function parseWikiSections(content: string): WikiSection[] {
    const sections: WikiSection[] = [];
    const sectionRegex = /^==\s*([^=]+?)\s*==\s*$/gm;
    const matches = [...content.matchAll(sectionRegex)];

    if (matches.length === 0) {
        return [{ title: "Introduction", content: content.trim() }];
    }

    const introContent = content.substring(0, matches[0].index ?? 0).trim();
    if (introContent) {
        sections.push({
            title: "Introduction",
            content: limitTo2Paragraphs(introContent),
        });
    }

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const sectionTitle = match[1].trim();

        if (!sectionTitle || /^[=\s]+$/.test(sectionTitle)) continue;
        if (
            IGNORED_SECTIONS.some((s) => sectionTitle.toLowerCase().includes(s))
        )
            continue;

        const startIndex = (match.index ?? 0) + match[0].length;
        const endIndex =
            i < matches.length - 1
                ? (matches[i + 1].index ?? content.length)
                : content.length;

        let sectionContent = content.substring(startIndex, endIndex).trim();
        sectionContent = sectionContent
            .replace(/^=+\s*[^=]*?\s*=+$/gm, "")
            .trim();

        if (sectionContent.replace(/[=\s\n]+/g, "").length >= 20) {
            sections.push({
                title: sectionTitle,
                content: limitTo2Paragraphs(sectionContent),
            });
        }

        if (sections.length >= 2) {
            break;
        }
    }

    return sections;
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

const WIKI_API = "https://fr.wikipedia.org/w/api.php";

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`[wiki] HTTP ${res.status} fetching ${url}`);
    }
    return res.json() as Promise<T>;
}

export async function fetchRandomWikiPage(
    minContentLength = 1000,
    maxAttempts = 25,
): Promise<WikiPage> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const randomData = await fetchJson<RandomPageResponse>(
                `${WIKI_API}?action=query&format=json&list=random&rnnamespace=0&rnlimit=1`,
            );

            const pageTitle = randomData.query?.random?.[0]?.title;
            if (!pageTitle) continue;

            const pageData = await fetchJson<WikiApiResponse>(
                `${WIKI_API}?action=query&format=json&titles=${encodeURIComponent(pageTitle)}&prop=extracts|images&explaintext=true&imlimit=500`,
            );

            const pages = pageData.query?.pages;
            if (!pages) continue;

            const page = Object.values(pages)[0] as PageData;
            const content = page.extract ?? "";

            if (content.length < minContentLength) continue;

            const imageUrls: string[] = [];
            if (page.images?.length) {
                const imageTitles = page.images
                    .map((img) => img.title)
                    .join("|");
                const imgData = await fetchJson<WikiApiResponse>(
                    `${WIKI_API}?action=query&format=json&titles=${encodeURIComponent(imageTitles)}&prop=imageinfo&iiprop=url`,
                );

                for (const imgPage of Object.values(
                    imgData.query?.pages ?? {},
                )) {
                    const info = (imgPage as ImagePage).imageinfo?.[0];
                    if (info?.url) imageUrls.push(info.url);
                }
            }

            return {
                title: pageTitle,
                images: filterGenericImages(imageUrls),
                sections: parseWikiSections(content),
            };
        } catch (error) {
            console.error(`[wiki] Tentative ${attempt}/${maxAttempts}:`, error);
        }
    }

    throw new Error(
        `Impossible de trouver une page ≥ ${minContentLength} car. après ${maxAttempts} tentatives`,
    );
}
