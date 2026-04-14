export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Vérifier la connexion à la base de données en premier
        const { verifyDatabaseConnection } = await import("@/lib/db-check");
        await verifyDatabaseConnection();

        const { ensureDailyWikiPage } = await import("@/lib/game/daily-wiki");

        const { dailyPurge } = await import("@/lib/batchs/purge");
        const { startDailyCron } = await import("@/lib/batchs/dailyPage");

        try {
            await ensureDailyWikiPage();
        } catch (error) {
            console.error("[instrumentation]", error);
        }

        dailyPurge();
        startDailyCron();

        // Cleanup stale coop caches every 30 minutes
        const { cleanupCoopCaches } = await import("@/lib/game/coop-game");
        setInterval(() => cleanupCoopCaches(), 30 * 60 * 1000);
    }
}
