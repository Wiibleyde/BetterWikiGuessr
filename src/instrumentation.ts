export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Vérifier la connexion à la base de données en premier
        const { verifyDatabaseConnection } = await import("@/lib/db-check");
        await verifyDatabaseConnection();

        const { ensureDailyWikiPage, startDailyCron } = await import(
            "@/lib/game/daily-wiki"
        );

        try {
            await ensureDailyWikiPage();
        } catch (error) {
            console.error("[instrumentation]", error);
        }

        startDailyCron();

        // Cleanup stale coop caches every 30 minutes
        const { cleanupCoopCaches } = await import("@/lib/game/coop-game");
        setInterval(() => cleanupCoopCaches(), 30 * 60 * 1000);
    }
}
