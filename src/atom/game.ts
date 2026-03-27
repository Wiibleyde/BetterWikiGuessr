import { atom } from "jotai";
import type { MaskedArticle, RevealedMap, StoredGuess } from "@/types/game";

export const articleAtom = atom<MaskedArticle | null>(null);
export const guessesAtom = atom<StoredGuess[]>([]);
export const revealedAtom = atom<RevealedMap>({});
export const inputAtom = atom<string>("");
export const loadingAtom = atom<boolean>(false);
export const wonAtom = atom<boolean>(false);
export const savedAtom = atom<boolean>(false);
export const errorAtom = atom<string | null>(null);
export const guessingAtom = atom<boolean>(false);

export const syncedAtom = atom<boolean>(false);
export const revealedImagesAtom = atom<string[]>([]);
export const winImagesAtom = atom<string[]>([]);
export const revealingHintAtom = atom<boolean>(false);
