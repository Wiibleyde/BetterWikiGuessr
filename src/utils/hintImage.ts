export function buildHintImageUrl(hintIndex: number): string {
    return `/api/game/hint/image?index=${hintIndex}`;
}

export function normalizeHintImageUrls(urls: string[] | undefined): string[] {
    return Array.from({ length: urls?.length ?? 0 }, (_, index) =>
        buildHintImageUrl(index),
    );
}
