import type { MaskedArticle, RevealedMap, WordToken } from "@/types/game";
import { posKey } from "@/utils/helper";

export function computeRevealPercentage(
    revealed: RevealedMap,
    article: MaskedArticle | null,
): number {
    const totalWords = article?.totalWords ?? 0;
    return totalWords > 0
        ? Math.round((Object.keys(revealed).length / totalWords) * 100)
        : 0;
}

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
