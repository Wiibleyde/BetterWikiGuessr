import { computeHistoricPages } from "@/lib/services/historic/computeHistoricPages";
import type { PageEntry } from "@/types/historic";

export async function getHistoric(): Promise<PageEntry[]> {
    return computeHistoricPages();
}
