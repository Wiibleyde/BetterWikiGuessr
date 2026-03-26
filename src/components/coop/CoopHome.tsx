"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import useCoopLobby from "@/hooks/useCoopLobby";
import ErrorMessage from "../ui/Error";
import Layout from "../ui/Layout";
import CoopForm from "./CoopForm";

export default function CoopHome() {
    const { createLobby, joinLobby, loading, error } = useCoopLobby();
    const [mode, setMode] = useState<"create" | "join">("join");    

    if (error) {
        return <ErrorMessage message={error} />;
    }

    return (
        <Layout
            title="🤝 Mode Co-op"
            subtitle="Jouez à plusieurs pour deviner l'article Wikipédia !"
        >
            <div className="flex flex-row items-start justify-around mb-6 bg-white rounded-xl py-2 mx-auto max-w-75">
                <Button
                    onClick={() => setMode("create")}
                    disabled={loading}
                    variant={mode === "create" ? "navbarActive" : "navbar"}
                >
                    Créer un lobby
                </Button>
                <Button
                    onClick={() => setMode("join")}
                    disabled={loading}
                    variant={mode === "join" ? "navbarActive" : "navbar"}
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
