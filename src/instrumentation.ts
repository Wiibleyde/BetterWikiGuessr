/**
 * Next.js Instrumentation — exécuté une seule fois au démarrage du serveur.
 * Utilisé pour s'assurer qu'une page wiki du jour existe en DB
 * et lancer le cron de vérification quotidienne.
 */
export async function register() {
    // Ne s'exécute que côté serveur Node.js (pas dans le Edge Runtime)
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { ensureDailyWikiPage, startDailyCron } = await import(
            "@/lib/daily-wiki"
        );

        // Au démarrage : s'assurer qu'on a la page du jour
        try {
            await ensureDailyWikiPage();
        } catch (error) {
            console.error(
                "[instrumentation] Impossible de charger la page du jour :",
                error,
            );
        }

        // Lancer le cron qui vérifie chaque minute si un nouveau jour est arrivé
        startDailyCron();
    }
}
