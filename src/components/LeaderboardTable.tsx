"use client";

import Image from "next/image";
import type {
    LeaderboardCategoryMeta,
    LeaderboardEntry,
} from "@/types/leaderboard";

interface LeaderboardTableProps {
    meta: LeaderboardCategoryMeta;
    entries: LeaderboardEntry[];
}

const RANK_BADGES: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
};

function formatValue(value: number, meta: LeaderboardCategoryMeta): string {
    return `${value} ${meta.valueLabel}`;
}

export default function LeaderboardTable({
    meta,
    entries,
}: LeaderboardTableProps) {
    if (entries.length === 0) {
        return (
            <p className="text-center text-gray-400 text-sm py-6">
                Aucune donnée pour ce classement.
            </p>
        );
    }

    return (
        <div className="divide-y divide-gray-100">
            {entries.map((entry) => (
                <div
                    key={entry.userId}
                    className={[
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        entry.rank <= 3 ? "bg-amber-50/40" : "hover:bg-gray-50",
                    ].join(" ")}
                >
                    {/* Rang */}
                    <span className="w-8 text-center text-sm font-bold text-gray-500 shrink-0">
                        {RANK_BADGES[entry.rank] ?? `#${entry.rank}`}
                    </span>

                    {/* Avatar + nom */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        {entry.avatar ? (
                            <Image
                                src={`https://cdn.discordapp.com/avatars/${entry.discordId}/${entry.avatar}.png?size=32`}
                                alt=""
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded-full shrink-0"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-800 truncate">
                            {entry.username}
                        </span>
                    </div>

                    {/* Valeur + détail */}
                    <div className="text-right shrink-0">
                        <span className="text-sm font-semibold text-gray-900">
                            {formatValue(entry.value, meta)}
                        </span>
                        {entry.detail && (
                            <p className="text-xs text-gray-400 mt-0.5">
                                {entry.detail}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
