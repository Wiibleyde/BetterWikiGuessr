"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { LeaderboardCategoryData } from "@/types/leaderboard";
import LeaderboardCategory from "./LeaderboardCategory";

export default function LeaderboardContent() {
    const initializedRef = useRef(false);
    const [openCategories, setOpenCategories] = useState<Set<string>>(
        new Set(),
    );

    const { data, error, isLoading } = useSWR<{
        categories: LeaderboardCategoryData[];
    }>("/api/leaderboard", fetcher, {
        revalidateOnFocus: false,
        onSuccess: (data) => {
            if (!initializedRef.current) {
                setOpenCategories(
                    new Set(data.categories.map((c) => c.meta.id)),
                );
                initializedRef.current = true;
            }
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-gray-500 text-lg animate-pulse">
                    Chargement du classement…
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-red-500 text-lg">
                    Impossible de charger le classement.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        🏅 Classement
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Les meilleurs joueurs de WikiGuessr
                    </p>
                </div>

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
            </main>
        </div>
    );
}
