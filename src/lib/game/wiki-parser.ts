import { GENERIC_IMAGE_PATTERNS, IGNORED_SECTIONS } from "@/constants/wiki";
import type { WikiSection } from "@/types/wiki";

export function limitTo2Paragraphs(
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

export function filterGenericImages(imageUrls: string[]): string[] {
    return imageUrls.filter((url) => {
        const fileName = url.split("/").pop()?.toLowerCase() ?? "";
        return !GENERIC_IMAGE_PATTERNS.some((pattern) =>
            pattern.test(fileName),
        );
    });
}

export function parseWikiSections(
    content: string,
    title: string,
): WikiSection[] {
    const parts = content.split(/^==\s*([^=]+?)\s*==\s*$/gm);
    const sections: WikiSection[] = [];

    const intro = parts[0].trim();
    if (intro) {
        sections.push({
            title,
            content: limitTo2Paragraphs(intro),
        });
    }

    for (let i = 1; i < parts.length - 1 && sections.length < 2; i += 2) {
        const sectionTitle = parts[i].trim();
        const body = parts[i + 1].replace(/^=+[^=]+=+$/gm, "").trim();

        if (
            IGNORED_SECTIONS.some((s) => sectionTitle.toLowerCase().includes(s))
        ) {
            continue;
        }

        if (body.replace(/\s/g, "").length < 20) continue;

        sections.push({
            title: sectionTitle,
            content: limitTo2Paragraphs(body),
        });
    }

    return sections.length > 0
        ? sections
        : [{ title, content: content.trim() }];
}
