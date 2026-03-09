import type { MaskedArticle, RevealedMap, WordToken } from "@/types/game";
import { posKey } from "./helper";

export function checkWinCondition(
    article: MaskedArticle,
    revealed: RevealedMap,
): boolean {
    const titleWords = article.sections[0]?.titleTokens.filter(
        (t): t is WordToken => t.type === "word",
    );
    return (
        titleWords !== undefined &&
        titleWords.length > 0 &&
        titleWords.every(
            (t) => revealed[posKey(0, "title", t.index)] !== undefined,
        )
    );
}
