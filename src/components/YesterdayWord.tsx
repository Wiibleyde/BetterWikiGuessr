"use client";

import { useEffect, useState } from "react";

export default function YesterdayWord() {
    const [title, setTitle] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/game/yesterday")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur serveur");
                return res.json();
            })
            .then((data: { title: string | null }) => {
                setTitle(data.title);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, []);

    if (loading || !title) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                Le mot d&apos;hier
            </div>
            <div className="px-4 py-3">
                <p className="text-base font-medium text-gray-800 text-center">
                    {title}
                </p>
            </div>
        </div>
    );
}
