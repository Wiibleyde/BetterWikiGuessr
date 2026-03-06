export const STORAGE_KEY_PREFIX = "wikiguessr-";
export const TOKEN_REGEX = /([\p{L}0-9]+)|(\n)|(\s+)|([^\s\p{L}0-9]+)/gu;

export const REVEAL_THRESHOLD = 0.85;
export const MIN_FUZZY_LENGTH = 4;
export const MAX_LENGTH_RATIO = 1.5;
export const CLOSE_THRESHOLD = 0.65;

export const HINT_PENALTY = 20;
export const MIN_GUESSES_FOR_HINT = 20;
