export interface WordToken {
    type: "word";
    id: string;
    index: number;
    length: number;
}

export interface PunctuationToken {
    type: "punct";
    id: string;
    text: string;
}

export type Token = WordToken | PunctuationToken;

export interface MaskedSection {
    titleTokens: Token[];
    contentTokens: Token[];
}

export interface MaskedArticle {
    articleTitleTokens: Token[];
    sections: MaskedSection[];
    totalWords: number;
    date: string;
    imageCount: number;
}

export interface WordPosition {
    section: number;
    part: "title" | "content";
    wordIndex: number;
    display: string;
}

export interface GuessResult {
    found: boolean;
    word: string;
    positions: WordPosition[];
    occurrences: number;
    similarity: number;
    serverDate: string;
}

export interface StoredGuess {
    word: string;
    found: boolean;
    occurrences: number;
    similarity: number;
}

export type RevealedMap = Record<string, string>;

export interface GameCache {
    guesses: StoredGuess[];
    revealed: RevealedMap;
    saved?: boolean;
    revealedImages?: string[];
}

export const HINT_PENALTY = 5;
