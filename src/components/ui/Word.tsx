"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { plural } from "@/utils/helper";

const VARIANTS = {
    articleTitle: "bg-amber-200 text-amber-900 font-bold",
    default: "bg-emerald-100 text-emerald-900",
} as const;

type WordVariant = keyof typeof VARIANTS;

interface WordProps {
    length: number;
    text?: string;
    variant?: WordVariant;
}

export default function Word({ length, text, variant = "default" }: WordProps) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (text) {
            setAnimate(true);
            const timer = setTimeout(() => setAnimate(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [text]);

    if (text) {
        return (
            <span
                className={cn(
                    "inline-block px-0.5 rounded",
                    VARIANTS[variant],
                    animate && "animate-reveal",
                )}
            >
                {text}
            </span>
        );
    }

    return (
        <span
            className="inline-block bg-gray-300 rounded-sm mx-px align-middle cursor-default"
            style={{ width: `${length}ch`, height: "1.15em" }}
            title={plural(length, "caractère", "caractères")}
        />
    );
}
