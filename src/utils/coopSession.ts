import type { CoopJoinResponse } from "@/types/coop";

const TOKEN_KEY = (code: string) => `coop:${code}:token`;
const PLAYER_ID_KEY = (code: string) => `coop:${code}:playerId`;

export function storeCoopSession(result: CoopJoinResponse): void {
    sessionStorage.setItem(TOKEN_KEY(result.code), result.playerToken);
    sessionStorage.setItem(PLAYER_ID_KEY(result.code), String(result.playerId));
}

export function getCoopToken(code: string): string | null {
    return sessionStorage.getItem(TOKEN_KEY(code));
}

export function getCoopPlayerId(code: string): number | null {
    const raw = sessionStorage.getItem(PLAYER_ID_KEY(code));
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
}
