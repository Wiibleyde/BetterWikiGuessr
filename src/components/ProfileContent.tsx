"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
    const { user, loading: authLoading, logout } = useAuth();
    const [stats, setStats] = useState<ProfileStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setLoading(false);
            return;
        }

        fetch("/api/profile/stats")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur");
                return res.json();
            })
            .then((data: ProfileStats) => setStats(data))
            .catch((err) => console.error("[profile/stats]", err))
            .finally(() => setLoading(false));
    }, [user, authLoading]);

    if (authLoading || loading) {
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
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <a
                            href="/"
                            className="text-xl font-extrabold tracking-tight text-gray-800 hover:text-gray-600 transition-colors"
                        >
                            WikiGuessr
                        </a>
                        <span className="text-gray-400">·</span>
                        <span className="text-sm text-gray-500">Profil</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a
                            href="/leaderboard"
                            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Classement
                        </a>
                        <div className="flex items-center gap-3">
                            {user.avatar && (
                                <Image
                                    src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=32`}
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="w-7 h-7 rounded-full"
                                />
                            )}
                            <span className="text-sm text-gray-700">
                                {user.username}
                            </span>
                            <button
                                type="button"
                                onClick={logout}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                {stats && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
