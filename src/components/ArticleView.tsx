"use client";

import type { MaskedArticle, RevealedMap } from "@/types/game";
import Section from "./article/Section";

interface ArticleViewProps {
    article: MaskedArticle;
    revealed: RevealedMap;
}

export default function ArticleView({ article, revealed }: ArticleViewProps) {
    return (
        <main className="flex-1 min-w-0 space-y-4">
            {article.sections.map((sec, index) => (
                <Section
                    key={sec.contentTokens[0].id}
                    sectionIndex={index}
                    titleTokens={sec.titleTokens}
                    contentTokens={sec.contentTokens}
                    revealed={revealed}
                />
            ))}
        </main>
    );
}
