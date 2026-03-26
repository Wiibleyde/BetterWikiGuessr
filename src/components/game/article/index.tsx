"use client";

import type { MaskedArticle, RevealedMap } from "@/types/game";
import Section from "./Section";
import TokenList from "./TokenList";

interface ArticleViewProps {
    article: MaskedArticle;
    revealed: RevealedMap;
}

export default function ArticleView({ article, revealed }: ArticleViewProps) {
    return (
        <main className="flex-1 min-w-0 space-y-4">
            <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold leading-[2.2]">
                    <TokenList
                        tokens={article.sections[0].titleTokens}
                        section={0}
                        part="title"
                        revealed={revealed}
                    />
                </h2>
            </div>

            {article.sections.map((sec, index) => (
                <Section
                    key={sec.contentTokens[0]?.id ?? `section-${index}`}
                    sectionIndex={index}
                    titleTokens={index === 0 ? [] : sec.titleTokens}
                    contentTokens={sec.contentTokens}
                    revealed={revealed}
                />
            ))}
        </main>
    );
}
