"use client";

import useSWR from "swr";
import ErrorMessage from "@/components/ui/Error";
import Loader from "@/components/ui/Loader";
import NoDataMessage from "@/components/ui/NoDataMessage";
import type { PageEntry } from "@/types/historic";
import { fetcher } from "@/utils/fetcher";
import Layout from "../ui/Layout";
import PageHistoric from "./PageHistoric";

export default function HistoricContent() {
    const {
        data: pages,
        error,
        isLoading,
    } = useSWR<PageEntry[]>("/api/historic", fetcher, {
        revalidateOnFocus: false,
    });

    if (isLoading) return <Loader message="Chargement du classement…" />;

    if (error)
        return <ErrorMessage message="Impossible de charger le classement." />;

    if (pages && pages.length === 0 && !isLoading)
        return <NoDataMessage message="Aucune page disponible." />;

    return (
        <Layout
            title="🕒 Historique"
            subtitle="Découvrez les dernières pages Wikipédia qui ont été devinées dans WikiGuessr."
        >
            {pages?.map((page) => (
                <PageHistoric page={page} key={page.id} />
            ))}
        </Layout>
    );
}
