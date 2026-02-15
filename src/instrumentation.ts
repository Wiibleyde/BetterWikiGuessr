export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
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
