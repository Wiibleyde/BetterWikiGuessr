"use client";

import type { CoopPlayerInfo } from "@/types/coop";
import User from "../ui/User";

interface CoopPlayerListProps {
    players: CoopPlayerInfo[];
}

export default function CoopPlayerList({ players }: CoopPlayerListProps) {
    return (
        <div className="max-w-5xl mx-auto px-4 py-4 flex gap-4 mb-4">
            {players.map((player) => (
                <User
                    key={player.id}
                    name={player.displayName}
                    image={null}
                    pictureWidth={24}
                />
            ))}
        </div>
    );
}
