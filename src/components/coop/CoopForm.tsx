"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { CoopJoinResponse } from "@/types/coop";
import Button from "../ui/Button";
import Input from "../ui/Input";

interface CoopFormProps {
    mode: "create" | "join";
    loading: boolean;
    createLobby: (
        displayName: string,
        userId: string | undefined,
    ) => Promise<CoopJoinResponse | null>;
    joinLobby: (
        code: string,
        displayName: string,
        userId: string | undefined,
    ) => Promise<CoopJoinResponse | null>;
}

// TODO: Mettre ça ailleurs dans les utils
function storeCoopSession(result: CoopJoinResponse) {
    sessionStorage.setItem(`coop:${result.code}:token`, result.playerToken);
    sessionStorage.setItem(
        `coop:${result.code}:playerId`,
        String(result.playerId),
    );
}

export default function CoopForm({
    mode,
    loading,
    createLobby,
    joinLobby,
}: CoopFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [displayName, setDisplayName] = useState(user?.name ?? "");
    const [joinCode, setJoinCode] = useState<string>("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) return;
        const result = await createLobby(displayName.trim(), user?.id);
        if (result) {
            storeCoopSession(result);
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
            storeCoopSession(result);
            router.push(`/coop/${result.code}`);
        }
    };

    return (
        <form
            onSubmit={mode === "create" ? handleCreate : handleJoin}
            className="flex flex-col gap-4"
        >
            <div>
                <label
                    htmlFor="joinDisplayName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Votre pseudo
                </label>
                <Input
                    id="joinDisplayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Entrez votre pseudo"
                    className="mt-2 w-full"
                    maxLength={30}
                />
            </div>

            {mode === "join" && (
                <div>
                    <label
                        htmlFor="joinCode"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Code du lobby
                    </label>
                    <Input
                        id="joinCode"
                        value={joinCode}
                        onChange={(e) =>
                            setJoinCode(e.target.value.toUpperCase())
                        }
                        placeholder="Ex: ABC123"
                        maxLength={6}
                        className="mt-2 w-full uppercase"
                    />
                </div>
            )}
            <Button
                type="submit"
                disabled={loading || !displayName.trim() || !joinCode.trim()}
                className="w-full"
            >
                {loading ? "Connexion…" :
                    mode === "create" ?
                        "Créer le lobby" : "Rejoindre le lobby"
                }
            </Button>
        </form>
    );
}
