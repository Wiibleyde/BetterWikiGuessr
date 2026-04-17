import type { RevealedMap, WordPosition } from "@/types/game";

export const plural = (
    count: number,
    singular: string,
    plural: string,
): string => {
    return `${count} ${count === 1 ? singular : plural}`;
};

export function posKey(
    section: number,
    part: string,
    wordIndex: number,
): string {
    return `${section}:${part}:${wordIndex}`;
}

export function applyPositions(
    prev: RevealedMap,
    positions: readonly Pick<
        WordPosition,
        "section" | "part" | "wordIndex" | "display"
    >[],
): RevealedMap {
    const next = { ...prev };
    for (const pos of positions) {
        next[posKey(pos.section, pos.part, pos.wordIndex)] = pos.display;
    }
    return next;
}
