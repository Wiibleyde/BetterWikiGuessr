/** Identifiant d'une catégorie de classement — extensible via union */
export type LeaderboardCategoryId = "win-streak" | "best-guess" | "most-wins";

/** Métadonnées décrivant une catégorie de classement */
export interface LeaderboardCategoryMeta {
    id: LeaderboardCategoryId;
    label: string;
    description: string;
    icon: string; // emoji
    valueLabel: string; // ex: "jours", "essais", "victoires"
    sortOrder: "asc" | "desc"; // asc = lower is better, desc = higher is better
}

/** Une entrée dans un classement */
export interface LeaderboardEntry {
    rank: number;
    userId: number;
    username: string;
    avatar: string | null;
    discordId: string;
    value: number;
    detail?: string; // texte complémentaire (ex: "du 01/02 au 08/02")
}

/** Réponse complète d'une catégorie */
export interface LeaderboardCategoryData {
    meta: LeaderboardCategoryMeta;
    entries: LeaderboardEntry[];
}

/** Réponse de l'API /api/leaderboard */
export interface LeaderboardResponse {
    categories: LeaderboardCategoryData[];
}
