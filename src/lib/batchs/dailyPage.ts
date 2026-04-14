import * as cron from "node-cron";
import { ensureDailyWikiPage } from "../game/daily-wiki";

export function startDailyCron(): () => void {
    const task = cron.schedule(
        "0 0 * * *",
        async () => {
            try {
                console.log("[daily-wiki] Running daily wiki page fetch...");
                await ensureDailyWikiPage();
            } catch (error) {
                console.error("[daily-wiki] Erreur fetch quotidien :", error);
            }
        },
        { timezone: "Europe/Paris" },
    );

    return () => task.stop();
}
