import { computeHistoricPages } from "@/lib/historic";
import type { PageEntry } from "@/types/historic";

export async function getHistoric(): Promise<PageEntry[]> {
    return computeHistoricPages();
}
