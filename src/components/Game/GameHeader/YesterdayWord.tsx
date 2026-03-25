"use client";

import useSWR from "swr";
import { fetchYesterdayWord } from "@/lib/queries";

export default function YesterdayWord() {
    const { data: title } = useSWR<string | null>(
        "yesterday-word",
        fetchYesterdayWord,
        {
            revalidateOnFocus: false,
        },
    );

    if (!title) return null;

    return (
        <span className="text-sm text-gray-500">
            Hier : <span className="font-medium text-gray-700">{title}</span>
        </span>
    );
}
