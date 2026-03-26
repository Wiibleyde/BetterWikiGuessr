"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import useCoopLobby from "@/hooks/useCoopLobby";

export default function CoopHome() {
    const { user } = useAuth();
    const { createLobby, joinLobby, loading, error } = useCoopLobby();
    const [displayName, setDisplayName] = useState(user?.name ?? "");
    const [joinCode, setJoinCode] = useState("");
    const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) return;
        const result = await createLobby(displayName.trim(), user?.id);
        if (result) {
            sessionStorage.setItem(
                `coop:${result.code}:token`,
                result.playerToken,
            );
            sessionStorage.setItem(
                `coop:${result.code}:playerId`,
                String(result.playerId),
            );
            router.push(`/coop/${result.code}`);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || !joinCode.trim()) return;
        const result = await joinLobby(
            joinCode.trim().toUpperCase(),
            displayName.trim(),
            user?.id,
        );
        if (result) {
            sessionStorage.setItem(
                `coop:${result.code}:token`,
                result.playerToken,
            );
            sessionStorage.setItem(
                `coop:${result.code}:playerId`,
                String(result.playerId),
            );
            router.push(`/coop/${result.code}`);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            <div className="max-w-lg mx-auto px-4 py-12">
                <h1 className="text-3xl font-extrabold text-center mb-2">
                    Mode Co-op
                </h1>
                <p className="text-center text-gray-500 mb-8">
                    Jouez à plusieurs pour deviner l'article Wikipédia !
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                        {error}
                    </div>
                )}

                {mode === "menu" && (
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => setMode("create")}
                            className="w-full p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all text-left"
                        >
                            <div className="font-semibold text-gray-800">
                                Créer un lobby
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                Créez une partie et invitez vos amis avec un
                                code
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("join")}
                            className="w-full p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all text-left"
                        >
                            <div className="font-semibold text-gray-800">
                                Rejoindre un lobby
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                Entrez le code d'une partie existante
                            </div>
                        </button>
                    </div>
                )}

                {mode === "create" && (
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label
                                htmlFor="displayName"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Votre pseudo
                            </label>
                            <input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Entrez votre pseudo…"
                                maxLength={30}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setMode("menu")}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Retour
                            </button>
                            <Button
                                type="submit"
                                disabled={loading || !displayName.trim()}
                                className="flex-1"
                            >
                                {loading ? "Création…" : "Créer le lobby"}
                            </Button>
                        </div>
                    </form>
                )}

                {mode === "join" && (
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div>
                            <label
                                htmlFor="joinDisplayName"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Votre pseudo
                            </label>
                            <input
                                id="joinDisplayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Entrez votre pseudo…"
                                maxLength={30}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="joinCode"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Code du lobby
                            </label>
                            <input
                                id="joinCode"
                                type="text"
                                value={joinCode}
                                onChange={(e) =>
                                    setJoinCode(e.target.value.toUpperCase())
                                }
                                placeholder="Ex: ABC123"
                                maxLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-mono text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setMode("menu")}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Retour
                            </button>
                            <Button
                                type="submit"
                                disabled={
                                    loading ||
                                    !displayName.trim() ||
                                    !joinCode.trim()
                                }
                                className="flex-1"
                            >
                                {loading ? "Connexion…" : "Rejoindre"}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
