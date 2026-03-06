import type {
    MaskedArticle,
    RevealedMap, WordToken
} from "@/types/game";
import { posKey } from "./helper";

export function checkWinCondition(
    article: MaskedArticle,
    revealed: RevealedMap,
): boolean {
    const titleWords = article.articleTitleTokens.filter(
        (t): t is WordToken => t.type === "word",
    );
    return (
        titleWords.length > 0 &&
        titleWords.every(
            (t) => revealed[posKey(-1, "title", t.index)] !== undefined,
        )
    );
}
