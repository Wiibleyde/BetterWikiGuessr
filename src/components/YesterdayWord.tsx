"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export default function YesterdayWord() {
    const { data } = useSWR<{ title: string | null }>(
        "/api/game/yesterday",
        fetcher,
        { revalidateOnFocus: false },
    );

    if (!data?.title) return null;

    return (
        <>
            <span>·</span>
            <span className="text-sm text-gray-500">
                Hier :{" "}
                <span className="font-medium text-gray-700">{data.title}</span>
            </span>
        </>
    );
}
