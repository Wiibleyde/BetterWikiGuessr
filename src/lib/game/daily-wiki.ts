import { todayInGameTZ, todayKeyInGameTZ } from "@/lib/game/date";
import { fetchRandomWikiPage } from "@/lib/game/wiki";
import { prisma } from "@/lib/prisma";

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

    const today = todayInGameTZ();

    const existing = await prisma.dailyWikiPage.findUnique({
        where: { date: today },
    });

    if (existing) {
        setCache(existing);
        return existing;
    }

    const wikiPage = await fetchRandomWikiPage(1500);

    try {
        const created = await prisma.dailyWikiPage.create({
            data: {
                title: wikiPage.title,
                sections: JSON.parse(JSON.stringify(wikiPage.sections)),
                images: wikiPage.images,
                date: today,
                url: wikiPage.url,
            },
        });

        setCache(created);
        return created;
    } catch (error: unknown) {
        // Handle race condition: another request may have created the page
        const isUniqueViolation =
            error instanceof Error &&
            error.message.includes("Unique constraint");

        if (isUniqueViolation) {
            const fallback = await prisma.dailyWikiPage.findUnique({
                where: { date: today },
            });
            if (fallback) {
                setCache(fallback);
                return fallback;
            }
        }

        throw error;
    }
}

export function startDailyCron(): () => void {
    let lastCheckedDay = todayKeyInGameTZ();

    const interval = setInterval(async () => {
        const currentDay = todayKeyInGameTZ();
        if (currentDay !== lastCheckedDay) {
            lastCheckedDay = currentDay;
            try {
                await ensureDailyWikiPage();
            } catch (error) {
                console.error("[daily-wiki] Erreur fetch quotidien :", error);
            }
        }
    }, 60_000);

    return () => clearInterval(interval);
}
