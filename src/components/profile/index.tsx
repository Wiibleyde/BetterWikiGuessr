"use client";

import { useAuth } from "@/hooks/useAuth";
import { useFetchProfileStats } from "@/lib/query";
import Layout from "../ui/Layout";
import NoAuthScreen from "../ui/NoAuthScreen";
import NoDataMessage from "../ui/NoDataMessage";
import ProfileResult from "./ProfileResult";
import ProfileStatsRender from "./ProfileStatsRender";

export default function ProfileContent() {
    const { user, loading: authLoading } = useAuth();
    const { data: stats, isLoading: statsLoading } = useFetchProfileStats(
        user?.id ?? null,
        !authLoading,
    );

    if (!user) {
        return <NoAuthScreen />;
    }

    return (
        <Layout
            title={`👤 Profil de: ${user.name}`}
            subtitle="Consultez vos statistiques et votre historique de parties"
            isLoading={authLoading || statsLoading}
            loadingMessage={"Chargement de votre profil…"}
            noData={!stats && !statsLoading}
            noDataMessage={"Aucune statistique disponible pour le moment."}
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
                        <div className="bg-surface rounded-xl border border-border overflow-hidden">
                            <div className="px-4 py-3 border-b border-subtle">
                                <h2 className="font-semibold text-text font-(family-name:--font-heading)">
                                    Historique
                                </h2>
                            </div>
                            <div className="divide-y divide-subtle">
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
