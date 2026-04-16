"use client";

import { useFetchHistoric } from "@/lib/query";
import Layout from "../ui/Layout";
import HistoricalPageEntry from "./PageHistoric";

export default function HistoricContent() {
    const { data: pages, error, isLoading } = useFetchHistoric();

    return (
        <Layout
            title="🕒 Historique"
            subtitle="Découvrez les dernières pages Wikipédia qui ont été devinées dans WikiGuessr."
            isError={!!error}
            error={"Impossible de charger le historique."}
            isLoading={isLoading}
            loadingMessage={"Chargement du historique…"}
            noData={pages?.length === 0 && !isLoading}
            noDataMessage={"Aucune page disponible."}
        >
            {pages?.map((page) => (
                <HistoricalPageEntry page={page} key={page.id} />
            ))}
        </Layout>
    );
}
