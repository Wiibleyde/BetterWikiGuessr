import { todayKeyInGameTZ } from "@/lib/game/date";
import { fetchRandomWikiPage } from "@/lib/game/wiki";
import type { prisma } from "@/lib/prisma";
import {
    getTodaysArticle,
    upsertTodaysArticle,
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

    const page = await upsertTodaysArticle(wikiPage);
    setCache(page);
    return page;
}
