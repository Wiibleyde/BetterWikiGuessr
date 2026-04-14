import { todayKeyInGameTZ } from "@/lib/game/date";
import { fetchRandomWikiPage } from "@/lib/game/wiki";
import type { prisma } from "@/lib/prisma";
import {
    createArticle,
    getTodaysArticle,
} from "../repositories/articleRepository";

type DailyWikiPage = Awaited<
    ReturnType<typeof prisma.dailyWikiPage.findUnique>
> & {};

let cachedPage: DailyWikiPage | null = null;
let cachedDate: string | null = null;

function getCached(): DailyWikiPage | null {
    if (cachedPage && cachedDate === todayKeyInGameTZ()) return cachedPage;
    cachedPage = null;
    cachedDate = null;
    return null;
}

function setCache(page: DailyWikiPage) {
    cachedPage = page;
    cachedDate = todayKeyInGameTZ();
}

export async function ensureDailyWikiPage(): Promise<DailyWikiPage> {
    const cached = getCached();
    if (cached) return cached;

    const existing = await getTodaysArticle();

    if (existing) {
        setCache(existing);
        return existing;
    }

    const wikiPage = await fetchRandomWikiPage(1500);

    try {
        const created = await createArticle(wikiPage);

        setCache(created);
        return created;
    } catch (error: unknown) {
        // Handle race condition: another request may have created the page
        const isUniqueViolation =
            error instanceof Error &&
            error.message.includes("Unique constraint");

        if (isUniqueViolation) {
            const fallback = await getTodaysArticle();
            if (fallback) {
                setCache(fallback);
                return fallback;
            }
        }

        throw error;
    }
}
