"use client";

import useSWR from "swr";
import Loader from "@/components/ui/Loader";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileStats } from "@/types/auth";
import { fetcher } from "@/utils/fetcher";
import Layout from "../ui/Layout";
import NoDataMessage from "../ui/NoDataMessage";
import ProfileResult from "./ProfileResult";
import ProfileStatsRender from "./ProfileStatsRender";

export default function ProfileContent() {
    const { user, loading: authLoading, login } = useAuth();
    const { data: stats, isLoading: statsLoading } = useSWR<ProfileStats>(
        user ? "/api/profile/stats" : null,
        fetcher,
        { revalidateOnFocus: false },
    );

    if (authLoading || statsLoading)
        return <Loader message="Chargement de votre profil…" />;

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 gap-4">
                <p className="text-gray-600 text-lg">
                    Connectez-vous avec Discord pour voir vos statistiques.
                </p>
                <button
                    type="button"
                    onClick={login}
                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Connexion Discord
                </button>
            </div>
        );
    }

    return (
        <Layout
            title={`👤 Profil de: ${user.name}`}
            subtitle="Consultez vos statistiques et votre historique de parties"
        >
            {stats && (
                <>
                    <ProfileStatsRender
                        stats={[
                            { label: "Parties", value: stats.totalGames },
                            { label: "Victoires", value: stats.totalWins },
                            {
                                label: "Taux de victoire",
                                value: `${stats.winRate}%`,
                            },
                            {
                                label: "Moy. essais",
                                value: stats.averageGuesses,
                            },
                            {
                                label: "Moy. indices",
                                value: stats.averageHints,
                            },
                        ]}
                    />

                    {stats.results.length > 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-800">
                                    Historique
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {stats.results.map((result) => (
                                    <ProfileResult
                                        result={result}
                                        key={result.id}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <NoDataMessage message="Aucune partie enregistrée." />
                    )}
                </>
            )}
        </Layout>
    );
}
