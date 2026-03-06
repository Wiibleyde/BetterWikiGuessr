export const plural = (count: number, singular: string, plural: string) => {
    return `${count} ${count < 2 ? singular : plural}`;
};

export function posKey(
    section: number,
    part: string,
    wordIndex: number,
): string {
    return `${section}:${part}:${wordIndex}`;
}