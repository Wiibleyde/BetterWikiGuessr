"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Layout from "../ui/Layout";

interface CoopJoinFormProps {
    code: string;
    loading: boolean;
    error: string | null;
    onJoin: (displayName: string) => Promise<void>;
}

export default function CoopJoinForm({
    code,
    loading,
    error,
    onJoin,
}: CoopJoinFormProps) {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState(user?.name ?? "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || loading) return;
        await onJoin(displayName.trim());
    };

    return (
        <Layout
            title="🤝 Rejoindre la partie"
            subtitle={`Lobby ${code}`}
            error={error || "Impossible de rejoindre le lobby."}
            isError={!!error}
        >
            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 mx-auto max-w-sm"
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
                <Button
                    type="submit"
                    disabled={loading || !displayName.trim()}
                    className="w-full"
                >
                    {loading ? "Connexion…" : "Rejoindre le lobby"}
                </Button>
            </form>
        </Layout>
    );
}
