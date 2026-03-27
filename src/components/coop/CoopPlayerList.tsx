"use client";

import type { CoopPlayerInfo } from "@/types/coop";

const PLAYER_COLORS = [
    "bg-blue-50 border-blue-200",
    "bg-emerald-50 border-emerald-200",
    "bg-amber-50 border-amber-200",
    "bg-purple-50 border-purple-200",
];

interface CoopPlayerListProps {
    players: CoopPlayerInfo[];
    currentPlayerId: number | null;
}

export default function CoopPlayerList({
    players,
    currentPlayerId,
}: CoopPlayerListProps) {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {players.map((player, i) => (
                <div
                    key={player.id}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium ${
                        PLAYER_COLORS[i % PLAYER_COLORS.length]
                    } ${player.id === currentPlayerId ? "ring-2 ring-blue-400" : ""}`}
                >
                    {player.displayName}
                    {player.isLeader && " ★"}
                    <span className="ml-1.5 text-gray-400">
                        {player.guessCount}
                    </span>
                </div>
            ))}
        </div>
    );
}
