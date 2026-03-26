"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { CoopPlayerInfo } from "@/types/coop";
import { plural } from "@/utils/helper";

interface CoopWaitingProps {
    code: string;
    players: CoopPlayerInfo[];
    isLeader: boolean;
    loading: boolean;
    onStart: () => void;
}

export default function CoopWaiting({
    code,
    players,
    isLeader,
    loading,
    onStart,
}: CoopWaitingProps) {
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            <div className="max-w-lg mx-auto px-4 py-12">
                <h1 className="text-2xl font-extrabold text-center mb-6">
                    Lobby Co-op
                </h1>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="text-center mb-4">
                        <p className="text-sm text-gray-500 mb-2">
                            Code du lobby
                        </p>
                        <button
                            type="button"
                            onClick={copyCode}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            <span className="text-3xl font-mono font-bold tracking-[0.3em] text-gray-800">
                                {code}
                            </span>
                            <span className="text-xs text-gray-400">
                                {copied ? "Copié !" : "Copier"}
                            </span>
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                        Partagez ce code avec vos amis pour qu'ils rejoignent.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                        {plural(players.length, "joueur", "joueurs")} (max 4)
                    </div>
                    <div className="divide-y divide-gray-50">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className="px-4 py-3 flex items-center justify-between"
                            >
                                <span className="text-sm font-medium text-gray-800">
                                    {player.displayName}
                                </span>
                                {player.isLeader && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                        Leader
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {isLeader ? (
                    <Button
                        onClick={onStart}
                        disabled={loading || players.length < 1}
                        className="w-full py-3 text-base"
                    >
                        {loading ? "Lancement…" : "Lancer la partie"}
                    </Button>
                ) : (
                    <div className="text-center text-sm text-gray-500 py-4">
                        En attente du leader pour lancer la partie…
                    </div>
                )}
            </div>
        </div>
    );
}
