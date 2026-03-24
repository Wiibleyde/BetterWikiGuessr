export const HINT_IMAGE_URL_VERSION = "3";

export function buildHintImageUrl(hintIndex: number): string {
    return `/api/game/hint/image?index=${hintIndex}&v=${HINT_IMAGE_URL_VERSION}`;
}

export function normalizeHintImageUrls(urls: string[] | undefined): string[] {
    return Array.from({ length: urls?.length ?? 0 }, (_, index) =>
        buildHintImageUrl(index),
    );
}
