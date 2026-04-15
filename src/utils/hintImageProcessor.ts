import { sleep } from "bun";
import sharp from "sharp";
import {
    BASE_RETRY_DELAY_MS,
    MAX_CONCURRENT_WIKI_FETCHES,
    MAX_FETCH_RETRIES,
    MAX_WIDTH,
    MIN_PIXELATED_HEIGHT,
    MIN_PIXELATED_WIDTH,
    MIN_TIME_BETWEEN_FETCHES_MS,
    OBFUSCATION_BLUR,
    OBFUSCATION_PROFILE,
    PIXELATION_DIVISOR,
    USER_AGENT,
    WEBP_QUALITY,
} from "@/constants/hint";

// In-memory cache: date → (index → processed image buffer)
let imageCache: {
    date: string;
    profile: string;
    entries: Map<number, Uint8Array>;
} | null = null;

// In-flight requests: index → promise resolving to processed image
const inFlight = new Map<number, Promise<Uint8Array | null>>();

// Concurrency limiter for outgoing Wikipedia fetches
let activeFetches = 0;
const waitQueue: Array<() => void> = [];
let nextAllowedFetchAt = 0;

function getRetryDelayMs(response: Response, attempt: number): number {
    const retryAfter = response.headers.get("retry-after");

    if (retryAfter) {
        const seconds = Number.parseInt(retryAfter, 10);
        if (!Number.isNaN(seconds)) {
            return Math.max(seconds * 1000, BASE_RETRY_DELAY_MS);
        }
        const retryDate = Date.parse(retryAfter);
        if (!Number.isNaN(retryDate)) {
            return Math.max(retryDate - Date.now(), BASE_RETRY_DELAY_MS);
        }
    }

    return BASE_RETRY_DELAY_MS * attempt;
}

async function waitForNextFetchWindow(): Promise<void> {
    const now = Date.now();
    const waitMs = Math.max(0, nextAllowedFetchAt - now);
    if (waitMs > 0) await sleep(waitMs);
    nextAllowedFetchAt = Date.now() + MIN_TIME_BETWEEN_FETCHES_MS;
}

async function acquireFetchSlot(): Promise<void> {
    if (activeFetches < MAX_CONCURRENT_WIKI_FETCHES) {
        activeFetches++;
        return;
    }
    await new Promise<void>((resolve) => waitQueue.push(resolve));
    activeFetches++;
}

function releaseFetchSlot(): void {
    activeFetches--;
    const next = waitQueue.shift();
    if (next) next();
}

export function getCachedImage(
    date: string,
    index: number,
): Uint8Array | undefined {
    if (
        imageCache?.date !== date ||
        imageCache.profile !== OBFUSCATION_PROFILE
    ) {
        imageCache = { date, profile: OBFUSCATION_PROFILE, entries: new Map() };
        return undefined;
    }
    return imageCache.entries.get(index);
}

export function setCachedImage(
    date: string,
    index: number,
    data: Uint8Array,
): void {
    if (
        imageCache?.date !== date ||
        imageCache.profile !== OBFUSCATION_PROFILE
    ) {
        imageCache = { date, profile: OBFUSCATION_PROFILE, entries: new Map() };
    }
    imageCache.entries.set(index, data);
}

async function fetchAndProcess(imageUrl: string): Promise<Uint8Array | null> {
    await acquireFetchSlot();
    try {
        let response: Response | null = null;

        for (let attempt = 1; attempt <= MAX_FETCH_RETRIES; attempt++) {
            await waitForNextFetchWindow();
            response = await fetch(imageUrl, {
                headers: { "User-Agent": USER_AGENT },
            });

            if (response.ok) break;

            if (response.status !== 429 || attempt === MAX_FETCH_RETRIES) {
                console.error(
                    `[hintImageProcessor] Failed to fetch upstream image: ${response.status}`,
                );
                return null;
            }

            const retryDelayMs = getRetryDelayMs(response, attempt);
            console.warn(
                `[hintImageProcessor] Rate limited (${response.status}), retrying in ${retryDelayMs}ms (attempt ${attempt}/${MAX_FETCH_RETRIES})`,
            );
            await sleep(retryDelayMs);
        }

        if (!response?.ok) return null;

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        const resizedBuffer = await sharp(imageBuffer)
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .toBuffer();

        const { width, height } = await sharp(resizedBuffer).metadata();
        if (!width || !height) {
            console.error(
                "[hintImageProcessor] Unable to get image dimensions",
            );
            return null;
        }

        const pixelatedWidth = Math.max(
            MIN_PIXELATED_WIDTH,
            Math.round(width / PIXELATION_DIVISOR),
        );
        const pixelatedHeight = Math.max(
            MIN_PIXELATED_HEIGHT,
            Math.round(height / PIXELATION_DIVISOR),
        );

        const pixelatedBuffer = await sharp(resizedBuffer)
            .resize({
                width: pixelatedWidth,
                height: pixelatedHeight,
                fit: "fill",
                kernel: "nearest",
            })
            .resize({ width, height, fit: "fill", kernel: "nearest" })
            .toBuffer();

        const noise = Buffer.alloc(width * height * 4);
        for (let i = 0; i < noise.length; i++) {
            noise[i] = i % 4 === 3 ? 120 : Math.floor(Math.random() * 256);
        }

        const obfuscated = await sharp(pixelatedBuffer)
            .blur(OBFUSCATION_BLUR)
            .composite([
                {
                    input: noise,
                    raw: { width, height, channels: 4 },
                    blend: "overlay",
                },
            ])
            .webp({ quality: WEBP_QUALITY })
            .toBuffer();

        return new Uint8Array(obfuscated);
    } finally {
        releaseFetchSlot();
    }
}

/**
 * Returns the processed (obfuscated) image buffer for a given hint index,
 * using in-memory cache and in-flight deduplication.
 */
export async function processHintImage(
    imageUrl: string,
    date: string,
    hintIndex: number,
): Promise<Uint8Array | null> {
    const cached = getCachedImage(date, hintIndex);
    if (cached) return cached;

    let promise = inFlight.get(hintIndex);
    if (!promise) {
        promise = fetchAndProcess(imageUrl).finally(() => {
            inFlight.delete(hintIndex);
        });
        inFlight.set(hintIndex, promise);
    }

    const processed = await promise;
    if (processed) setCachedImage(date, hintIndex, processed);
    return processed;
}
