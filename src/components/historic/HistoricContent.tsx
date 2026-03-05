"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { PageEntry } from "@/types/historic";

const HistoricContent = () => {
    const [pages, setPages] = useState<PageEntry[]>([]);

    const { data, error, isLoading } = useSWR<PageEntry[]>("/api/historic", fetcher, {
        revalidateOnFocus: false,
        onSuccess: (data) => {
            setPages(data);
        },
    });

    return <div>
        {JSON.stringify(pages)}
    </div>;
};

export default HistoricContent;
