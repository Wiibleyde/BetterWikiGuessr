const GAME_TZ = process.env.GAME_TIMEZONE || "Europe/Paris";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: GAME_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

/**
 * Returns a UTC Date object whose year/month/day correspond to "today"
 * in the configured game timezone (defaults to Europe/Paris).
 * Handles DST transitions automatically via the Intl API.
 */
export function todayInGameTZ(): Date {
    const parts = dateFormatter.formatToParts(new Date());
    const year = Number(parts.find((p) => p.type === "year")?.value);
    const month = Number(parts.find((p) => p.type === "month")?.value);
    const day = Number(parts.find((p) => p.type === "day")?.value);
    return new Date(Date.UTC(year, month - 1, day));
}

export function todayKeyInGameTZ(): string {
    return todayInGameTZ().toISOString();
}

export function yesterdayInGameTZ(): Date {
    const today = todayInGameTZ();
    return new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate() - 1,
        ),
    );
}
