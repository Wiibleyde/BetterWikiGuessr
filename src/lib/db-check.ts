import { prisma } from "@/lib/prisma";

/**
 * Vérifie que la base de données est accessible
 * Lève une erreur si la connexion échoue
 */
export async function verifyDatabaseConnection(): Promise<void> {
    try {
        // Exécute une simple requête pour tester la connexion
        await prisma.$queryRaw`SELECT 1`;
        console.log("[db-check] ✓ Connexion à la base de données réussie");
    } catch (_error) {
        console.error(
            "[db-check] ✗ Impossible de se connecter à la base de données:",
        );
        console.error("[db-check] Arrêt du programme...");
        process.exit(1);
    }
}
