"use client";

import type { MaskedArticle, RevealedMap } from "@/types/game";
import TokenList from "./TokenList";

interface ArticleViewProps {
    article: MaskedArticle;
    revealed: RevealedMap;
    lastRevealedWord: string | null;
}

export default function ArticleView({
    article,
    revealed,
    lastRevealedWord,
}: ArticleViewProps) {
    return (
        <main className="flex-1 min-w-0 space-y-4">
            <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold leading-[2.2]">
                    <TokenList
                        tokens={article.articleTitleTokens}
                        section={-1}
                        part="title"
                        revealed={revealed}
                        lastRevealedWord={lastRevealedWord}
                    />
                </h2>
            </div>

            {article.sections.map((sec, index) => {
                const sectionKey =
                    sec.titleTokens[0]?.id ??
                    sec.contentTokens[0]?.id ??
                    `section-${index}`;
                return (
                    <section
                        key={sectionKey}
                        className="p-5 bg-white rounded-xl shadow-sm border border-gray-100"
                    >
                        <h3 className="text-lg font-semibold mb-2 leading-[2.2]">
                            <TokenList
                                tokens={sec.titleTokens}
                                section={index}
                                part="title"
                                revealed={revealed}
                                lastRevealedWord={lastRevealedWord}
                            />
                        </h3>
                        <div className="text-sm leading-[2.2]">
                            <TokenList
                                tokens={sec.contentTokens}
                                section={index}
                                part="content"
                                revealed={revealed}
                                lastRevealedWord={lastRevealedWord}
                            />
                        </div>
                    </section>
                );
            })}
        </main>
    );
}
