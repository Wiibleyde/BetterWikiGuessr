import { describe, expect, it } from "bun:test";
import {
    todayInGameTZ,
    todayKeyInGameTZ,
    yesterdayInGameTZ,
} from "@/lib/game/date";

describe("todayInGameTZ", () => {
    it("returns a Date object", () => {
        const today = todayInGameTZ();
        expect(today).toBeInstanceOf(Date);
    });

    it("returns a UTC midnight date", () => {
        const today = todayInGameTZ();
        expect(today.getUTCHours()).toBe(0);
        expect(today.getUTCMinutes()).toBe(0);
        expect(today.getUTCSeconds()).toBe(0);
    });
});

describe("todayKeyInGameTZ", () => {
    it("returns an ISO string", () => {
        const key = todayKeyInGameTZ();
        expect(key).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
    });
});

describe("yesterdayInGameTZ", () => {
    it("returns a date one day before today", () => {
        const today = todayInGameTZ();
        const yesterday = yesterdayInGameTZ();
        const diff = today.getTime() - yesterday.getTime();

        expect(diff).toBe(86_400_000);
    });

    it("returns a UTC midnight date", () => {
        const yesterday = yesterdayInGameTZ();
        expect(yesterday.getUTCHours()).toBe(0);
        expect(yesterday.getUTCMinutes()).toBe(0);
    });
});
