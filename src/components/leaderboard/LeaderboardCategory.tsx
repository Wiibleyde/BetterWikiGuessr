"use client";

import type { LeaderboardCategoryData } from "@/types/leaderboard";
import LeaderboardTable from "./LeaderboardTable";

interface LeaderboardCategoryProps {
    data: LeaderboardCategoryData;
    isOpen: boolean;
    onToggle: () => void;
}

export default function LeaderboardCategory({
    data,
    isOpen,
    onToggle,
}: LeaderboardCategoryProps) {
    const { meta, entries } = data;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-800 text-sm">
                            {meta.label}
                        </h3>
                        <p className="text-xs text-gray-400">
                            {meta.description}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {entries.length > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {entries.length} joueur{entries.length !== 1 && "s"}
                        </span>
                    )}
                    <svg
                        className={[
                            "w-4 h-4 text-gray-400 transition-transform duration-200",
                            isOpen ? "rotate-180" : "",
                        ].join(" ")}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        role="img"
                        aria-label="Basculer la catégorie"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </button>

            {isOpen && <LeaderboardTable meta={meta} entries={entries} />}
        </div>
    );
}
