"use client";

import { useEffect, useState } from "react";
import type { LeaderboardCategoryData } from "@/types/leaderboard";
import LeaderboardCategory from "./LeaderboardCategory";

export default function LeaderboardContent() {
    const [categories, setCategories] = useState<LeaderboardCategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openCategories, setOpenCategories] = useState<Set<string>>(
        new Set(),
    );

    useEffect(() => {
        fetch("/api/leaderboard")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur serveur");
                return res.json();
            })
            .then((data: { categories: LeaderboardCategoryData[] }) => {
                setCategories(data.categories);
                // Ouvrir toutes les catégories par défaut
                setOpenCategories(
                    new Set(data.categories.map((c) => c.meta.id)),
                );
            })
            .catch((err) => {
                console.error("[leaderboard]", err);
                setError("Impossible de charger le classement.");
            })
            .finally(() => setLoading(false));
    }, []);

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

    if (loading) {
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
                <p className="text-red-500 text-lg">{error}</p>
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
                        <span className="text-sm text-gray-500">
                            Classement
                        </span>
                    </div>
                    <nav className="flex items-center gap-4 text-sm">
                        <a
                            href="/"
                            className="text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Jouer
                        </a>
                        <a
                            href="/profile"
                            className="text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Profil
                        </a>
                    </nav>
                </div>
            </header>

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
