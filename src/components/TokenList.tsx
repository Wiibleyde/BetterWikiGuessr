"use client";

import { posKey } from "@/hooks/useGameState";
import { normalizeWord } from "@/lib/game/normalize";
import type { RevealedMap, Token } from "@/types/game";

interface TokenListProps {
    tokens: Token[];
    section: number;
    part: "title" | "content";
    revealed: RevealedMap;
    lastRevealedWord: string | null;
}

export default function TokenList({
    tokens,
    section,
    part,
    revealed,
    lastRevealedWord,
}: TokenListProps) {
    return (
        <>
            {tokens.map((token) => {
                if (token.type === "punct") {
                    if (token.text === "\n") return <br key={token.id} />;
                    return (
                        <span key={token.id} className="text-gray-500">
                            {token.text}
                        </span>
                    );
                }

                const key = posKey(section, part, token.index);
                const displayText = revealed[key];

                if (displayText) {
                    const isArticleTitle = section === -1;
                    const normalized = normalizeWord(displayText);
                    const isJustRevealed =
                        lastRevealedWord !== null &&
                        normalized === lastRevealedWord;

                    return (
                        <span
                            key={token.id}
                            className={[
                                "inline-block px-0.5 rounded transition-all duration-300",
                                isArticleTitle
                                    ? "bg-amber-200 text-amber-900 font-bold"
                                    : "bg-emerald-100 text-emerald-900",
                                isJustRevealed
                                    ? "ring-2 ring-blue-400 scale-105"
                                    : "",
                            ].join(" ")}
                        >
                            {displayText}
                        </span>
                    );
                }

                return (
                    <span
                        key={token.id}
                        className="inline-block bg-gray-300 rounded-sm mx-px align-middle cursor-default"
                        style={{ width: `${token.length}ch`, height: "1.15em" }}
                        title={`${token.length} lettre${token.length > 1 ? "s" : ""}`}
                    />
                );
            })}
        </>
    );
}
