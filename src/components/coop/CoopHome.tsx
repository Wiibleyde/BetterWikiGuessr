"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import useCoopLobby from "@/hooks/useCoopLobby";
import Layout from "../ui/Layout";
import CoopForm from "./CoopForm";

export default function CoopHome() {
    const { createLobby, joinLobby, loading, error } = useCoopLobby();
    const [mode, setMode] = useState<"create" | "join">("join");

    return (
        <Layout
            title="🤝 Mode Co-op"
            subtitle="Jouez à plusieurs pour deviner l'article Wikipédia !"
            error={error || "Impossible de charger le mode en ligne."}
            isError={!!error}
            isLoading={loading}
            loadingMessage={"Chargement du mode en ligne"}
        >
            <div className="flex flex-row items-start justify-center mb-6 rounded-xl py-2 ">
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

            <CoopForm
                mode={mode}
                loading={loading}
                createLobby={createLobby}
                joinLobby={joinLobby}
            />
        </Layout>
    );
}
