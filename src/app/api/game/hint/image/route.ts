import { NextResponse } from "next/server";
import sharp from "sharp";
import { getHintImage } from "@/lib/game/game";
import { HINT_IMAGE_URL_VERSION } from "@/utils/hintImage";

export const dynamic = "force-dynamic";

const MAX_WIDTH = 600;
const WEBP_QUALITY = 75;
const CACHE_MAX_AGE = 86400; // 24 hours
const USER_AGENT = "WikiGuessr/1.0 (https://wikiguessr.com)";
const MAX_CONCURRENT_WIKI_FETCHES = 1;
const MAX_FETCH_RETRIES = 4;
const MIN_TIME_BETWEEN_FETCHES_MS = 1200;
const BASE_RETRY_DELAY_MS = 1500;
const HARD_OBFUSCATION = true; // If true, applies a heavy noise+blur overlay to make hints less obvious
const OBFUSCATION_PROFILE = HARD_OBFUSCATION
    ? `hard-v${HINT_IMAGE_URL_VERSION}`
    : `plain-v${HINT_IMAGE_URL_VERSION}`;
const PIXELATION_DIVISOR = 14;
const MIN_PIXELATED_WIDTH = 24;
const MIN_PIXELATED_HEIGHT = 24;
const OBFUSCATION_BLUR = 3;
const RESPONSE_CACHE_CONTROL =
    process.env.NODE_ENV === "production"
        ? `public, max-age=${CACHE_MAX_AGE}, immutable`
        : "no-store";

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

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    if (waitMs > 0) {
        await sleep(waitMs);
    }

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

function getCachedImage(date: string, index: number): Uint8Array | undefined {
    if (
        imageCache?.date !== date ||
        imageCache.profile !== OBFUSCATION_PROFILE
    ) {
        imageCache = {
            date,
            profile: OBFUSCATION_PROFILE,
            entries: new Map(),
        };
        return undefined;
    }
    return imageCache.entries.get(index);
}

function setCachedImage(date: string, index: number, data: Uint8Array): void {
    if (
        imageCache?.date !== date ||
        imageCache.profile !== OBFUSCATION_PROFILE
    ) {
        imageCache = {
            date,
            profile: OBFUSCATION_PROFILE,
            entries: new Map(),
        };
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

            if (response.ok) {
                break;
            }

            if (response.status !== 429 || attempt === MAX_FETCH_RETRIES) {
                console.error(
                    `[api/game/hint/image] Failed to fetch upstream image: ${response.status}`,
                );
                return null;
            }

            const retryDelayMs = getRetryDelayMs(response, attempt);
            console.warn(
                `[api/game/hint/image] Upstream rate limited (${response.status}), retrying in ${retryDelayMs}ms (attempt ${attempt}/${MAX_FETCH_RETRIES})`,
            );
            await sleep(retryDelayMs);
        }

        if (!response?.ok) {
            return null;
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());

        const resizedBuffer = await sharp(imageBuffer)
            .resize({ width: MAX_WIDTH, withoutEnlargement: true })
            .toBuffer();

        const { width, height } = await sharp(resizedBuffer).metadata();
        if (!width || !height) {
            console.error(
                `[api/game/hint/image] Unable to get image dimensions for obfuscation`,
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
            .resize({
                width,
                height,
                fit: "fill",
                kernel: "nearest",
            })
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

export async function GET(request: Request): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const indexParam = searchParams.get("index");

        if (indexParam === null || Number.isNaN(Number(indexParam))) {
            return NextResponse.json(
                { error: "Paramètre index manquant ou invalide" },
                { status: 400 },
            );
        }

        const hintIndex = Number.parseInt(indexParam, 10);
        const result = await getHintImage(hintIndex);

        if (!result) {
            return NextResponse.json(
                { error: "Aucune image disponible pour cet index" },
                { status: 404 },
            );
        }

        // Serve from in-memory cache if available
        const cached = getCachedImage(result.date, hintIndex);
        if (cached) {
            return new NextResponse(new Uint8Array(cached), {
                status: 200,
                headers: {
                    "Content-Type": "image/webp",
                    "Cache-Control": RESPONSE_CACHE_CONTROL,
                    "Content-Length": String(cached.length),
                    "X-WikiGuessr-Obfuscation": OBFUSCATION_PROFILE,
                },
            });
        }

        // Coalesce concurrent requests for the same index into one upstream fetch
        let promise = inFlight.get(hintIndex);
        if (!promise) {
            promise = fetchAndProcess(result.imageUrl).finally(() => {
                inFlight.delete(hintIndex);
            });
            inFlight.set(hintIndex, promise);
        }

        const processed = await promise;
        if (!processed) {
            return NextResponse.json(
                { error: "Impossible de récupérer l'image" },
                { status: 502 },
            );
        }

        setCachedImage(result.date, hintIndex, processed);

        return new NextResponse(new Uint8Array(processed), {
            status: 200,
            headers: {
                "Content-Type": "image/webp",
                "Cache-Control": RESPONSE_CACHE_CONTROL,
                "Content-Length": String(processed.length),
                "X-WikiGuessr-Obfuscation": OBFUSCATION_PROFILE,
            },
        });
    } catch (error) {
        console.error("[api/game/hint/image]", error);
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
    }
}
