import { ensureDailyWikiPage } from "./daily-wiki";

// ─── Types ───────────────────────────────────────────────────────────────────

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
}

export interface WordPosition {
    section: number; // -1 = article title
    part: "title" | "content";
    wordIndex: number;
    display: string; // original word (preserving case)
}

export interface GuessResult {
    found: boolean;
    word: string;
    positions: WordPosition[];
    occurrences: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise un mot pour la comparaison :
 * minuscule + suppression des accents (NFD + strip combining marks).
 */
function normalizeWord(word: string): string {
    return word
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Tokenise un texte en mots (alpha-numériques) et ponctuation/espaces.
 * Les apostrophes et tirets séparent les mots.
 */
const TOKEN_REGEX = /([a-zA-ZÀ-ÿ0-9]+)|(\n)|(\s+)|([^\sa-zA-ZÀ-ÿ0-9]+)/g;

interface InternalWord {
    normalized: string;
    display: string;
    index: number;
}

interface TokenizeResult {
    tokens: Token[];
    words: InternalWord[];
}

function tokenize(text: string, prefix = ""): TokenizeResult {
    const tokens: Token[] = [];
    const words: InternalWord[] = [];
    let wordIndex = 0;
    let tokenId = 0;

    const regex = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags);

    for (
        let match = regex.exec(text);
        match !== null;
        match = regex.exec(text)
    ) {
        if (match[1]) {
            // Mot
            tokens.push({
                type: "word",
                id: `${prefix}w${tokenId++}`,
                index: wordIndex,
                length: match[1].length,
            });
            words.push({
                normalized: normalizeWord(match[1]),
                display: match[1],
                index: wordIndex,
            });
            wordIndex++;
        } else {
            // Ponctuation, espace ou saut de ligne
            tokens.push({
                type: "punct",
                id: `${prefix}p${tokenId++}`,
                text: match[0],
            });
        }
    }

    return { tokens, words };
}

// ─── API publique ────────────────────────────────────────────────────────────

/**
 * Retourne la structure masquée de l'article du jour.
 * Aucun texte n'est envoyé — uniquement des longueurs de mots
 * et la ponctuation/espaces visibles.
 */
export async function getMaskedArticle(): Promise<MaskedArticle> {
    const page = await ensureDailyWikiPage();
    const sections = page.sections as { title: string; content: string }[];

    const { tokens: articleTitleTokens, words: titleWords } = tokenize(
        page.title,
        "at-",
    );
    let totalWords = titleWords.length;

    const maskedSections: MaskedSection[] = [];

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const { tokens: titleTokens, words: stw } = tokenize(
            section.title,
            `s${i}t-`,
        );
        const { tokens: contentTokens, words: scw } = tokenize(
            section.content,
            `s${i}c-`,
        );
        totalWords += stw.length + scw.length;
        maskedSections.push({ titleTokens, contentTokens });
    }

    return {
        articleTitleTokens,
        sections: maskedSections,
        totalWords,
        date: page.date.toISOString().split("T")[0],
    };
}

/**
 * Vérifie un mot deviné contre l'article du jour.
 * Retourne toutes les positions où le mot apparaît (titre de l'article,
 * titres de sections, contenu des sections).
 */
export async function checkGuess(word: string): Promise<GuessResult> {
    const page = await ensureDailyWikiPage();
    const sections = page.sections as { title: string; content: string }[];

    const normalizedGuess = normalizeWord(word.trim());

    if (!normalizedGuess) {
        return { found: false, word: "", positions: [], occurrences: 0 };
    }

    const positions: WordPosition[] = [];

    // Vérifier le titre de l'article
    const { words: titleWords } = tokenize(page.title);
    for (const w of titleWords) {
        if (w.normalized === normalizedGuess) {
            positions.push({
                section: -1,
                part: "title",
                wordIndex: w.index,
                display: w.display,
            });
        }
    }

    // Vérifier chaque section (titre + contenu)
    for (let i = 0; i < sections.length; i++) {
        const { words: sectionTitleWords } = tokenize(sections[i].title);
        for (const w of sectionTitleWords) {
            if (w.normalized === normalizedGuess) {
                positions.push({
                    section: i,
                    part: "title",
                    wordIndex: w.index,
                    display: w.display,
                });
            }
        }

        const { words: sectionContentWords } = tokenize(sections[i].content);
        for (const w of sectionContentWords) {
            if (w.normalized === normalizedGuess) {
                positions.push({
                    section: i,
                    part: "content",
                    wordIndex: w.index,
                    display: w.display,
                });
            }
        }
    }

    return {
        found: positions.length > 0,
        word: normalizedGuess,
        positions,
        occurrences: positions.length,
    };
}
