"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import type { CoopPlayerInfo } from "@/types/coop";
import { plural } from "@/utils/helper";
import Layout from "../ui/Layout";
import Player from "./Player";

interface CoopWaitingProps {
    code: string;
    players: CoopPlayerInfo[];
    isLeader: boolean;
    loading: boolean;
    onStart: () => void;
    onLeave: () => void;
}

export default function CoopWaiting({
    code,
    players,
    isLeader,
    loading,
    onStart,
    onLeave,
}: CoopWaitingProps) {
    const [copied, setCopied] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyLink = () => {
        const link = `${window.location.origin}/coop/${code}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    return (
        <Layout
            title="🤝 Lobby Co-op"
            subtitle="En attente du lancement de la partie"
        >
            <div className="bg-surface rounded-xl shadow-sm border border-border p-6 mb-6">
                <div className="text-center mb-4">
                    <p className="text-sm text-muted mb-2">Code du lobby</p>
                    <button
                        type="button"
                        onClick={copyCode}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-page rounded-lg border border-border hover:bg-subtle transition-colors cursor-pointer"
                    >
                        <span className="text-3xl font-bold tracking-[0.3em] text-text font-(family-name:--font-heading)">
                            {code}
                        </span>
                        <span className="text-xs text-muted">
                            {copied ? "Copié !" : "Copier"}
                        </span>
                    </button>
                </div>

                <p className="text-center text-sm text-muted">
                    Partagez ce code avec vos amis pour qu'ils rejoignent.
                </p>

                <div className="flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={copyLink}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-text bg-primary-light rounded-lg border border-primary/20 hover:bg-primary-light/70 transition-colors cursor-pointer"
                    >
                        🔗{" "}
                        {copiedLink
                            ? "Lien copié !"
                            : "Copier le lien d'invitation"}
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden mb-6">
                <div className="px-4 py-2.5 bg-page border-b border-subtle text-sm font-semibold text-text-secondary">
                    {plural(players.length, "joueur", "joueurs")} (max 4)
                </div>
                <div className="divide-y divide-subtle">
                    {players.map((player) => (
                        <Player
                            key={player.id}
                            displayName={player.displayName}
                            isLeader={player.isLeader}
                        />
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
                <div className="text-center text-sm text-muted py-4">
                    En attente du leader pour lancer la partie…
                </div>
            )}

            <Button
                onClick={onLeave}
                variant="secondary"
                className="w-full mt-2"
            >
                Quitter le lobby
            </Button>
        </Layout>
    );
}
