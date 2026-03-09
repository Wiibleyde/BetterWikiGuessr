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

export type ProximityReasonType =
    | "transposition"
    | "insertion"
    | "deletion"
    | "substitution"
    | "mixed";

export interface ProximityReason {
    type: ProximityReasonType;
    description: string;
}

export interface GuessResult {
    found: boolean;
    word: string;
    positions: WordPosition[];
    occurrences: number;
    similarity: number;
    serverDate: string;
    proximityReason?: ProximityReason;
}

export interface StoredGuess {
    word: string;
    found: boolean;
    occurrences: number;
    similarity: number;
    proximityReason?: ProximityReason;
}

export type RevealedMap = Record<string, string>;

export interface GameCache {
    guesses: StoredGuess[];
    revealed: RevealedMap;
    saved?: boolean;
    revealedImages?: string[];
}

export interface InternalWord {
    normalized: string;
    display: string;
    index: number;
}

export interface TokenizeResult {
    tokens: Token[];
    words: InternalWord[];
}

export interface ArticleCache {
    maskedArticle: MaskedArticle;
    wordGroups: Map<string, WordPosition[]>;
    titleWords: InternalWord[];
    images: string[];
    date: string;
}

export interface GameStateResponse {
    state: GameCache | null;
}

export interface RevealResponse {
    positions: WordPosition[];
}

export interface HintResponse {
    imageUrl: string;
    hintIndex: number;
    totalImages: number;
}
