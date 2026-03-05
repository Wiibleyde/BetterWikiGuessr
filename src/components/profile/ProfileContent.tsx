"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { fetcher } from "@/lib/fetcher";
import type { ProfileStats } from "@/types/auth";

interface StatCardProps {
    label: string;
    value: string | number;
}

function StatCard({ label, value }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
    );
}

export default function ProfileContent() {
    const { user, loading: authLoading } = useAuth();
    const { data: stats, isLoading: statsLoading } = useSWR<ProfileStats>(
        user ? "/api/profile/stats" : null,
        fetcher,
        { revalidateOnFocus: false },
    );

    if (authLoading || statsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-gray-500 text-lg animate-pulse">
                    Chargement…
                </p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
                <p className="text-gray-600 text-lg">
                    Connectez-vous avec Discord pour voir vos statistiques.
                </p>
                <a
                    href="/api/auth/login"
                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Connexion Discord
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {stats && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <StatCard
                                label="Parties"
                                value={stats.totalGames}
                            />
                            <StatCard
                                label="Victoires"
                                value={stats.totalWins}
                            />
                            <StatCard
                                label="Taux de victoire"
                                value={`${stats.winRate}%`}
                            />
                            <StatCard
                                label="Moy. essais"
                                value={stats.averageGuesses}
                            />
                            <StatCard
                                label="Moy. indices"
                                value={stats.averageHints}
                            />
                        </div>

                        {stats.results.length > 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <h2 className="font-semibold text-gray-800">
                                        Historique
                                    </h2>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {stats.results.map((r) => (
                                        <div
                                            key={r.id}
                                            className="px-4 py-3 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {r.articleTitle}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {r.date}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={[
                                                        "text-xs font-medium px-2 py-0.5 rounded-full",
                                                        r.won
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-red-100 text-red-700",
                                                    ].join(" ")}
                                                >
                                                    {r.won ? "Gagné" : "Perdu"}
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    {r.guessCount} essai
                                                    {r.guessCount !== 1 && "s"}
                                                </span>
                                                {r.hintsUsed > 0 && (
                                                    <span className="text-xs text-amber-500">
                                                        +{r.hintsUsed} indice
                                                        {r.hintsUsed !== 1 &&
                                                            "s"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 text-sm">
                                Aucune partie enregistrée.
                            </p>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
