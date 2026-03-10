import TokenList from "@/components/TokenList";
import type { RevealedMap, Token } from "@/types/game";

interface SectionProps {
    sectionIndex: number;
    titleTokens: Token[];
    contentTokens: Token[];
    revealed: RevealedMap;
}

export function Section({
    sectionIndex,
    titleTokens,
    contentTokens,
    revealed,
}: SectionProps) {
    return (
        <section className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
            {titleTokens.length > 0 && (
                <h3 className="text-lg font-semibold mb-2 leading-[2.2]">
                    <TokenList
                        tokens={titleTokens}
                        section={sectionIndex}
                        part="title"
                        revealed={revealed}
                    />
                </h3>
            )}
            <div className="text-sm leading-[2.2]">
                <TokenList
                    tokens={contentTokens}
                    section={sectionIndex}
                    part="content"
                    revealed={revealed}
                />
            </div>
        </section>
    );
}

export default Section;
