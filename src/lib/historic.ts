import type { PageEntry } from "@/types/historic";
import { getArticleLtDate } from "./repositories/articleRepository";

export async function computeHistoricPages(): Promise<PageEntry[]> {
    const today = new Date();

    const results = await getArticleLtDate(today);

    return results;
}
