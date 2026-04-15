import { todayKeyInGameTZ } from "@/lib/game/date";
import { getYesterdaysArticle } from "@/lib/repositories/articleRepository";

interface YesterdayCache {
    dayKey: string;
    title: string | null;
}

let cachedYesterday: YesterdayCache | null = null;

async function loadYesterdayTitle(): Promise<string | null> {
    const page = await getYesterdaysArticle();
    return page?.title ?? null;
}

export async function getCachedYesterdayTitle(): Promise<string | null> {
    const dayKey = todayKeyInGameTZ();

    if (cachedYesterday?.dayKey === dayKey) {
        return cachedYesterday.title;
    }

    const title = await loadYesterdayTitle();
    cachedYesterday = { dayKey, title };
    return title;
}

export async function warmYesterdayTitleCache(): Promise<void> {
    await getCachedYesterdayTitle();
}
