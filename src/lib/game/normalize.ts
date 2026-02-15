const DIACRITICS_REGEX = /[\u0300-\u036f]/g;

export function normalizeWord(word: string): string {
    return word.toLowerCase().normalize("NFD").replace(DIACRITICS_REGEX, "");
}
