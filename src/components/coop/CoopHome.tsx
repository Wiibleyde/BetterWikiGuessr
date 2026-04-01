"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import useCoopLobby from "@/hooks/useCoopLobby";
import type { CoopJoinResponse } from "@/types/coop";
import { storeCoopSession } from "@/utils/coopSession";
import Input from "../ui/Input";
import InputOtp from "../ui/InputOtp";
import Layout from "../ui/Layout";

export default function CoopHome() {
    const { user } = useAuth();
    const router = useRouter();
    const { createLobby, loading, error } = useCoopLobby();
    const [mode, setMode] = useState<"create" | "join">("join");
    const [displayName, setDisplayName] = useState(user?.name ?? "");
    const [joinCode, setJoinCode] = useState<Array<string>>(Array(6).fill(""));

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) return;
        const result = await createLobby(displayName.trim(), user?.id);
        if (result) {
            storeCoopSession(result as CoopJoinResponse);
            router.push(`/coop/${result.code}`);
        }
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.join("").trim().toUpperCase();
        if (!code) return;
        router.push(`/coop/${code}`);
    };

    const isCreateDisabled = loading || !displayName.trim();
    const isJoinDisabled = !joinCode.some((v) => v.trim());

    return (
        <Layout
            title="🤝 Mode Co-op"
            subtitle="Jouez à plusieurs pour deviner l'article Wikipédia !"
            error={error || "Impossible de charger le mode en ligne."}
            isError={!!error}
            isLoading={loading}
            loadingMessage={"Chargement du mode en ligne"}
        >
            <div className="flex flex-row items-start justify-center mb-6 rounded-xl py-2">
                <Button
                    onClick={() => setMode("create")}
                    disabled={loading}
                    variant={mode === "create" ? "navbarActive" : "navbar"}
                    className="rounded-r-none"
                >
                    Créer un lobby
                </Button>
                <Button
                    onClick={() => setMode("join")}
                    disabled={loading}
                    variant={mode === "join" ? "navbarActive" : "navbar"}
                    className="rounded-l-none"
                >
                    Rejoindre un lobby
                </Button>
            </div>

            {mode === "create" ? (
                <form
                    onSubmit={handleCreate}
                    className="flex flex-col gap-4 mx-auto max-w-sm"
                >
                    <div>
                        <label
                            htmlFor="createDisplayName"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Votre pseudo
                        </label>
                        <Input
                            id="createDisplayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Entrez votre pseudo"
                            className="mt-2 w-full"
                            maxLength={30}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isCreateDisabled}
                        className="w-full"
                    >
                        {loading ? "Création…" : "Créer le lobby"}
                    </Button>
                </form>
            ) : (
                <form
                    onSubmit={handleJoin}
                    className="flex flex-col gap-4 mx-auto max-w-sm"
                >
                    <div>
                        <label
                            htmlFor="joinCode"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Code du lobby
                        </label>
                        <InputOtp
                            length={6}
                            className="mt-4"
                            setCode={(code) => setJoinCode(code)}
                            value={joinCode}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isJoinDisabled}
                        className="w-full"
                    >
                        Rejoindre le lobby
                    </Button>
                </form>
            )}
        </Layout>
    );
}
