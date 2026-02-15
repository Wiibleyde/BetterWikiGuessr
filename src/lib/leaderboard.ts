import { prisma } from "@/lib/prisma";
import type {
    LeaderboardCategoryData,
    LeaderboardCategoryMeta,
    LeaderboardEntry,
} from "@/types/leaderboard";

const LEADERBOARD_LIMIT = 20;

// ---------------------------------------------------------------------------
// Registre des catégories — ajouter une entrée ici suffit pour créer
// une nouvelle catégorie de classement.
// ---------------------------------------------------------------------------

const CATEGORIES: LeaderboardCategoryMeta[] = [
    {
        id: "win-streak",
        label: "Meilleure série",
        description:
            "Le plus grand nombre de jours consécutifs avec une victoire",
        icon: "🔥",
        valueLabel: "jours",
        sortOrder: "desc",
    },
    {
        id: "best-guess",
        label: "Meilleure performance",
        description: "Le moins d'essais pour trouver un article",
        icon: "🎯",
        valueLabel: "essais",
        sortOrder: "asc",
    },
    {
        id: "most-wins",
        label: "Plus de victoires",
        description: "Le plus grand nombre total de victoires",
        icon: "🏆",
        valueLabel: "victoires",
        sortOrder: "desc",
    },
];

// ---------------------------------------------------------------------------
// Fonctions de calcul par catégorie
// ---------------------------------------------------------------------------

type CategoryComputer = () => Promise<LeaderboardEntry[]>;

async function computeWinStreak(): Promise<LeaderboardEntry[]> {
    // Récupérer toutes les victoires avec la date de la page, groupées par user
    const results = await prisma.gameResult.findMany({
        where: { won: true },
        select: {
            userId: true,
            user: { select: { username: true, avatar: true, discordId: true } },
            dailyWikiPage: { select: { date: true } },
        },
        orderBy: { dailyWikiPage: { date: "asc" } },
    });

    // Grouper par userId
    const byUser = new Map<
        number,
        {
            username: string;
            avatar: string | null;
            discordId: string;
            dates: Date[];
        }
    >();

    for (const r of results) {
        let entry = byUser.get(r.userId);
        if (!entry) {
            entry = {
                username: r.user.username,
                avatar: r.user.avatar,
                discordId: r.user.discordId,
                dates: [],
            };
            byUser.set(r.userId, entry);
        }
        entry.dates.push(r.dailyWikiPage.date);
    }

    // Calculer la plus longue série consécutive pour chaque user
    const streaks: {
        userId: number;
        username: string;
        avatar: string | null;
        discordId: string;
        streak: number;
        from: string;
        to: string;
    }[] = [];

    for (const [userId, data] of byUser) {
        const sorted = data.dates.map((d) => d.getTime()).sort((a, b) => a - b);

        // Éliminer les doublons (même jour)
        const unique = [
            ...new Set(sorted.map((t) => Math.floor(t / 86400000))),
        ];

        let maxStreak = 1;
        let currentStreak = 1;
        let maxStart = 0;
        let maxEnd = 0;
        let currentStart = 0;

        for (let i = 1; i < unique.length; i++) {
            if (unique[i] - unique[i - 1] === 1) {
                currentStreak++;
            } else {
                if (currentStreak > maxStreak) {
                    maxStreak = currentStreak;
                    maxStart = currentStart;
                    maxEnd = i - 1;
                }
                currentStreak = 1;
                currentStart = i;
            }
        }
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
            maxStart = currentStart;
            maxEnd = unique.length - 1;
        }

        const fromDate = new Date(unique[maxStart] * 86400000);
        const toDate = new Date(unique[maxEnd] * 86400000);

        streaks.push({
            userId,
            username: data.username,
            avatar: data.avatar,
            discordId: data.discordId,
            streak: maxStreak,
            from: fromDate.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
            }),
            to: toDate.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
            }),
        });
    }

    streaks.sort((a, b) => b.streak - a.streak);

    return streaks.slice(0, LEADERBOARD_LIMIT).map((s, i) => ({
        rank: i + 1,
        userId: s.userId,
        username: s.username,
        avatar: s.avatar,
        discordId: s.discordId,
        value: s.streak,
        detail: s.streak > 1 ? `du ${s.from} au ${s.to}` : undefined,
    }));
}

async function computeBestGuess(): Promise<LeaderboardEntry[]> {
    // Meilleure perf = le moins d'essais sur une partie gagnée
    const results = await prisma.gameResult.findMany({
        where: { won: true },
        select: {
            userId: true,
            guessCount: true,
            user: { select: { username: true, avatar: true, discordId: true } },
            dailyWikiPage: { select: { title: true, date: true } },
        },
        orderBy: { guessCount: "asc" },
    });

    // Garder la meilleure perf par user
    const best = new Map<number, LeaderboardEntry & { rawValue: number }>();

    for (const r of results) {
        if (!best.has(r.userId)) {
            const date = r.dailyWikiPage.date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            best.set(r.userId, {
                rank: 0,
                userId: r.userId,
                username: r.user.username,
                avatar: r.user.avatar,
                discordId: r.user.discordId,
                value: r.guessCount,
                detail: `${r.dailyWikiPage.title} (${date})`,
                rawValue: r.guessCount,
            });
        }
    }

    const sorted = [...best.values()].sort((a, b) => a.rawValue - b.rawValue);

    return sorted.slice(0, LEADERBOARD_LIMIT).map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        username: e.username,
        avatar: e.avatar,
        discordId: e.discordId,
        value: e.value,
        detail: e.detail,
    }));
}

async function computeMostWins(): Promise<LeaderboardEntry[]> {
    const results = await prisma.gameResult.groupBy({
        by: ["userId"],
        where: { won: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: LEADERBOARD_LIMIT,
    });

    // Récupérer les infos users en une seule requête
    const userIds = results.map((r) => r.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, avatar: true, discordId: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return results.map((r, i) => {
        const user = userMap.get(r.userId);
        return {
            rank: i + 1,
            userId: r.userId,
            username: user?.username ?? "Inconnu",
            avatar: user?.avatar ?? null,
            discordId: user?.discordId ?? "",
            value: r._count.id,
        };
    });
}

// ---------------------------------------------------------------------------
// Registre catégorie → fonction de calcul
// ---------------------------------------------------------------------------

const COMPUTERS: Record<string, CategoryComputer> = {
    "win-streak": computeWinStreak,
    "best-guess": computeBestGuess,
    "most-wins": computeMostWins,
};

// ---------------------------------------------------------------------------
// Export principal
// ---------------------------------------------------------------------------

export async function computeLeaderboard(): Promise<LeaderboardCategoryData[]> {
    const results: LeaderboardCategoryData[] = [];

    for (const meta of CATEGORIES) {
        const compute = COMPUTERS[meta.id];
        if (!compute) continue;
        const entries = await compute();
        results.push({ meta, entries });
    }

    return results;
}

export { CATEGORIES };
