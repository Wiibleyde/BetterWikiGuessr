"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { PageEntry } from "@/types/historic";

const HistoricContent = () => {
    const [pages, setPages] = useState<PageEntry[]>([]);

    const { error, isLoading } = useSWR<PageEntry[]>("/api/historic", fetcher, {
        revalidateOnFocus: false,
        onSuccess: (data) => {
            setPages(data);
        },
    });

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

    if (pages.length === 0 && !isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-gray-500 text-sm">Aucune page disponible.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        🕒 Historique
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Découvrez les dernières pages Wikipédia qui ont été
                        devinées dans WikiGuessr.
                    </p>
                </div>
                {pages.map((page) => (
                    <div
                        key={page.id}
                        className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 gap-4"
                    >
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs text-gray-400">
                                {new Date(page.date).toLocaleDateString(
                                    "fr-FR",
                                    {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    },
                                )}
                            </span>
                            <span className="text-sm font-medium text-gray-800 truncate">
                                {page.title}
                            </span>
                        </div>
                        <Link
                            href={page.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Voir l'article
                        </Link>
                    </div>
                ))}
            </main>
        </div>
    );
};

export default HistoricContent;
