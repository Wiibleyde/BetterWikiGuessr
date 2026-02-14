import { prisma } from "./prisma";
import { fetchRandomWikiPage } from "./wiki";

/**
 * Retourne la date du jour à minuit UTC (sans heures/minutes/secondes).
 */
function todayUTC(): Date {
    const now = new Date();
    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
}

/**
 * Récupère la page wiki du jour depuis la DB.
 * Si elle n'existe pas encore, en fetch une et la persiste.
 */
export async function ensureDailyWikiPage() {
    const today = todayUTC();

    // Vérifier si une page existe déjà pour aujourd'hui
    const existing = await prisma.dailyWikiPage.findUnique({
        where: { date: today },
    });

    if (existing) {
        console.log(
            `[daily-wiki] Page du jour déjà présente : "${existing.title}"`,
        );
        return existing;
    }

    // Aucune page pour aujourd'hui → en chercher une
    console.log("[daily-wiki] Aucune page pour aujourd'hui, fetch en cours…");
    const wikiPage = await fetchRandomWikiPage(2500);

    const created = await prisma.dailyWikiPage.create({
        data: {
            title: wikiPage.title,
            sections: JSON.parse(JSON.stringify(wikiPage.sections)),
            images: wikiPage.images,
            date: today,
        },
    });

    console.log(
        `[daily-wiki] Page créée : "${created.title}" (id=${created.id})`,
    );
    return created;
}

/**
 * Lance un intervalle qui vérifie toutes les minutes si on a changé de jour,
 * et fetch une nouvelle page si nécessaire.
 * Retourne une fonction de cleanup pour arrêter l'intervalle.
 */
export function startDailyCron(): () => void {
    let lastCheckedDay = todayUTC().toISOString();

    const interval = setInterval(async () => {
        const currentDay = todayUTC().toISOString();
        if (currentDay !== lastCheckedDay) {
            console.log("[daily-wiki] Nouveau jour détecté, fetch en cours…");
            lastCheckedDay = currentDay;
            try {
                await ensureDailyWikiPage();
            } catch (error) {
                console.error(
                    "[daily-wiki] Erreur lors du fetch quotidien :",
                    error,
                );
            }
        }
    }, 60_000); // Vérification toutes les 60 secondes

    return () => clearInterval(interval);
}
