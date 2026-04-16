"use client";

import { IoIosArrowUp } from "react-icons/io";
import type { LeaderboardCategoryData } from "@/types/leaderboard";

import { plural } from "@/utils/helper";
import Badge from "../ui/Badge";
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
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-page transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <div className="text-left">
                        <h3 className="font-semibold text-text font-(family-name:--font-heading) text-sm">
                            {meta.label}
                        </h3>
                        <p className="text-xs text-muted">{meta.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge color="primary">
                        {plural(entries.length, "joueur", "joueurs")}
                    </Badge>
                    <IoIosArrowUp
                        className={`w-4 h-4 text-muted transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`}
                        role="img"
                        aria-label="Basculer la catégorie"
                    />
                </div>
            </button>

            {isOpen && <LeaderboardTable meta={meta} entries={entries} />}
        </div>
    );
}
