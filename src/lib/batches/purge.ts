import * as cron from "node-cron";
import { deleteOldCoopGuess } from "../repositories/coopGuessRepository";
import { deleteOldPlayers } from "../repositories/coopPlayerRepository";
import { deleteOldLobbies } from "../repositories/coopRepository";

export function dailyPurge(): () => void {
    const task = cron.schedule(
        "0 0 * * *",
        async () => {
            try {
                console.log("[purge] Running daily purge...");
                // Supprimer les données de plus de 48 heures pour être sûr de ne pas supprimer des données encore utilisées
                const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

                await deleteOldCoopGuess(cutoffDate);
                await deleteOldLobbies(cutoffDate);
                await deleteOldPlayers(cutoffDate);

                console.log("[purge] Daily purge completed successfully.");
            } catch (error) {
                console.error("[purge] Erreur purge quotidienne :", error);
            }
        },
        { timezone: "Europe/Paris" },
    );

    return () => task.stop();
}
