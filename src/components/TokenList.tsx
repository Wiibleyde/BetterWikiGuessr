import type { RevealedMap, Token } from "@/types/game";
import { posKey } from "@/utils/helper";
import Word from "./ui/Word";

interface TokenListProps {
    tokens: Token[];
    section: number;
    part: "title" | "content";
    revealed: RevealedMap;
}

export default function TokenList({
    tokens,
    section,
    part,
    revealed,
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

                return (
                    <Word
                        key={token.id}
                        length={token.length}
                        text={displayText}
                        variant="default"
                    />
                );
            })}
        </>
    );
}
