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
    }
}
