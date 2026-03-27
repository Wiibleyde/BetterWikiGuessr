"use client";

import { useState } from "react";
import useSWR from "swr";
import type { LeaderboardCategoryData } from "@/types/leaderboard";
import { fetcher } from "@/utils/fetcher";
import Layout from "../ui/Layout";
import LeaderboardCategory from "./LeaderboardCategory";

export default function LeaderboardContent() {
    const [openCategories, setOpenCategories] = useState<Set<string>>(
        new Set(),
    );

    const { data, error, isLoading } = useSWR<{
        categories: LeaderboardCategoryData[];
    }>("/api/leaderboard", fetcher, {
        revalidateOnFocus: false,
        onSuccess: (data) => {
            setOpenCategories(new Set(data.categories.map((c) => c.meta.id)));
        },
    });

    const categories = data?.categories ?? [];

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
            error={error || "Impossible de charger le classement."}
            loadingMessage={"Chargement du classement…"}
            isLoading={isLoading}
        >
            {categories.length === 0 ? (
                <p className="text-center text-gray-400 text-sm">
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
