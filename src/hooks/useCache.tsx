import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import * as atomGame from "@/atom/game";
import { saveCache } from "@/utils/cache";

const useCache = () => {
    const article = useAtomValue(atomGame.articleAtom);
    const setSaved = useSetAtom(atomGame.savedAtom);
    const guesses = useAtomValue(atomGame.guessesAtom);
    const revealed = useAtomValue(atomGame.revealedAtom);
    const revealedImages = useAtomValue(atomGame.revealedImagesAtom);

    const markSaved = useCallback(() => {
        if (!article) return;
        setSaved(true);
        saveCache(article.date, guesses, revealed, true, revealedImages);
    }, [article, guesses, revealed, revealedImages, setSaved]);

    return { markSaved };
};

export default useCache;
