import { HINT_PENALTY } from "@/constants/game";
import {
    getBestScoreByUser,
    getMostWins,
    getVictoriesGroupedByUser,
} from "@/lib/repositories/gameResultRepository";
import { getUserWhereIdIn } from "@/lib/repositories/userRepository";
import type {
    LeaderboardCategoryData,
    LeaderboardCategoryMeta,
    LeaderboardEntry,
} from "@/types/leaderboard";

const LEADERBOARD_LIMIT = 20;

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
        description: "Le meilleur score (essais + pénalités d'indices)",
        icon: "🎯",
        valueLabel: "score",
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

type CategoryComputer = () => Promise<LeaderboardEntry[]>;

async function computeWinStreak(): Promise<LeaderboardEntry[]> {
    const results = await getVictoriesGroupedByUser();

    const byUser = new Map<
        string,
        {
            name: string;
            image: string | null;
            dates: Date[];
        }
    >();

    for (const r of results) {
        let entry = byUser.get(r.userId);
        if (!entry) {
            entry = {
                name: r.user.name,
                image: r.user.image,
                dates: [],
            };
            byUser.set(r.userId, entry);
        }
        entry.dates.push(r.dailyWikiPage.date);
    }

    const streaks: {
        userId: string;
        name: string;
        image: string | null;
        streak: number;
        from: string;
        to: string;
    }[] = [];

    for (const [userId, data] of byUser) {
        const sorted = data.dates.map((d) => d.getTime()).sort((a, b) => a - b);
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
            name: data.name,
            image: data.image,
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
        name: s.name,
        image: s.image,
        value: s.streak,
        detail: s.streak > 1 ? `du ${s.from} au ${s.to}` : undefined,
    }));
}

async function computeBestGuess(): Promise<LeaderboardEntry[]> {
    const results = await getBestScoreByUser();
    const best = new Map<string, LeaderboardEntry & { rawValue: number }>();

    for (const r of results) {
        const score = r.guessCount + r.hintsUsed * HINT_PENALTY;
        const existing = best.get(r.userId);
        if (!existing || score < existing.rawValue) {
            const date = r.dailyWikiPage.date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            const detail =
                r.hintsUsed > 0
                    ? `${r.dailyWikiPage.title} (${date}) — ${r.guessCount} essai${r.guessCount !== 1 ? "s" : ""} + ${r.hintsUsed} indice${r.hintsUsed !== 1 ? "s" : ""}`
                    : `${r.dailyWikiPage.title} (${date})`;

            best.set(r.userId, {
                rank: 0,
                userId: r.userId,
                name: r.user.name,
                image: r.user.image,
                value: score,
                detail,
                rawValue: score,
            });
        }
    }

    const sorted = [...best.values()].sort((a, b) => a.rawValue - b.rawValue);

    return sorted.slice(0, LEADERBOARD_LIMIT).map((e, i) => ({
        rank: i + 1,
        userId: e.userId,
        name: e.name,
        image: e.image,
        value: e.value,
        detail: e.detail,
    }));
}

async function computeMostWins(): Promise<LeaderboardEntry[]> {
    const results = await getMostWins();
    const userIds = results.map((r) => r.userId);
    const users = await getUserWhereIdIn(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    return results.map((r, i) => {
        const user = userMap.get(r.userId);
        return {
            rank: i + 1,
            userId: r.userId,
            name: user?.name ?? "Inconnu",
            image: user?.image ?? null,
            value: r._count.id,
        };
    });
}

const COMPUTERS: Record<string, CategoryComputer> = {
    "win-streak": computeWinStreak,
    "best-guess": computeBestGuess,
    "most-wins": computeMostWins,
};

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
