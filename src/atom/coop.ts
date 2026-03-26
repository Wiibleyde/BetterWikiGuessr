import { atom } from "jotai";
import type {
    CoopGuessEntry,
    CoopLobbyInfo,
    CoopPlayerInfo,
} from "@/types/coop";
import type { MaskedArticle, RevealedMap } from "@/types/game";

export const coopLobbyAtom = atom<CoopLobbyInfo | null>(null);
export const coopPlayersAtom = atom<CoopPlayerInfo[]>([]);
export const coopArticleAtom = atom<MaskedArticle | null>(null);
export const coopGuessesAtom = atom<CoopGuessEntry[]>([]);
export const coopRevealedAtom = atom<RevealedMap>({});
export const coopWonAtom = atom<boolean>(false);
export const coopPlayerIdAtom = atom<number | null>(null);
export const coopPlayerTokenAtom = atom<string | null>(null);
export const coopIsLeaderAtom = atom<boolean>(false);
export const coopLoadingAtom = atom<boolean>(false);
export const coopErrorAtom = atom<string | null>(null);
export const coopInputAtom = atom<string>("");
export const coopGuessingAtom = atom<boolean>(false);
