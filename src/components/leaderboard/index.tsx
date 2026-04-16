"use client";

import { useEffect, useState } from "react";
import { useFetchLeaderboard } from "@/lib/query";
import Layout from "../ui/Layout";
import LeaderboardCategory from "./LeaderboardCategory";

export default function LeaderboardContent() {
    const [openCategories, setOpenCategories] = useState<Set<string>>(
        new Set(),
    );

    const { data, error, isLoading } = useFetchLeaderboard();
    const categories = Array.isArray(data) ? data : [];

    // Set open categories when data loads
    useEffect(() => {
        if (data && data.length > 0) {
            setOpenCategories(new Set(data.map((c) => c.meta.id)));
        }
    }, [data]);

    function toggleCategory(id: string): void {
        setOpenCategories((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    return (
        <Layout
            title="🏅 Classement"
            subtitle="Les meilleurs joueurs de WikiGuessr"
            error={error ? "Impossible de charger le classement." : undefined}
            loadingMessage={"Chargement du classement…"}
            isLoading={isLoading}
        >
            {categories.length === 0 ? (
                <p className="text-center text-muted text-sm">
                    Aucun classement disponible pour le moment.
                </p>
            ) : (
                categories.map((cat) => (
                    <LeaderboardCategory
                        key={cat.meta.id}
                        data={cat}
                        isOpen={openCategories.has(cat.meta.id)}
                        onToggle={() => toggleCategory(cat.meta.id)}
                    />
                ))
            )}
        </Layout>
    );
}
