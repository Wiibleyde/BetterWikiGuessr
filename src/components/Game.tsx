"use client";

import {
    type FormEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

// ─── Types (miroir des types serveur) ────────────────────────────────────────

interface WordToken {
    type: "word";
    id: string;
    index: number;
    length: number;
}

interface PunctuationToken {
    type: "punct";
    id: string;
    text: string;
}

type Token = WordToken | PunctuationToken;

interface MaskedSection {
    titleTokens: Token[];
    contentTokens: Token[];
}

interface MaskedArticle {
    articleTitleTokens: Token[];
    sections: MaskedSection[];
    totalWords: number;
    date: string;
}

interface WordPosition {
    section: number;
    part: "title" | "content";
    wordIndex: number;
    display: string;
}

interface GuessResult {
    found: boolean;
    word: string;
    positions: WordPosition[];
    occurrences: number;
}

interface StoredGuess {
    word: string;
    found: boolean;
    occurrences: number;
}

// Map clé = "section:part:wordIndex" → texte révélé
type RevealedMap = Record<string, string>;

interface GameCache {
    guesses: StoredGuess[];
    revealed: RevealedMap;
}

const STORAGE_KEY_PREFIX = "wikiguessr-";

function posKey(section: number, part: string, wordIndex: number): string {
    return `${section}:${part}:${wordIndex}`;
}

// ─── Composant : rendu d'une liste de tokens ────────────────────────────────

function TokenList({
    tokens,
    section,
    part,
    revealed,
    lastRevealedWord,
}: {
    tokens: Token[];
    section: number;
    part: "title" | "content";
    revealed: RevealedMap;
    lastRevealedWord: string | null;
}) {
    return (
        <>
            {tokens.map((token) => {
                if (token.type === "punct") {
                    if (token.text === "\n") {
                        return <br key={token.id} />;
                    }
                    return (
                        <span key={token.id} className="text-gray-500">
                            {token.text}
                        </span>
                    );
                }

                const key = posKey(section, part, token.index);
                const displayText = revealed[key];

                if (displayText) {
                    const isArticleTitle = section === -1;
                    const isJustRevealed =
                        lastRevealedWord !== null &&
                        displayText
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "") ===
                            lastRevealedWord;
                    return (
                        <span
                            key={token.id}
                            className={[
                                "inline-block px-0.5 rounded transition-all duration-300",
                                isArticleTitle
                                    ? "bg-amber-200 text-amber-900 font-bold"
                                    : "bg-emerald-100 text-emerald-900",
                                isJustRevealed
                                    ? "ring-2 ring-blue-400 scale-105"
                                    : "",
                            ].join(" ")}
                        >
                            {displayText}
                        </span>
                    );
                }

                // Mot masqué
                return (
                    <span
                        key={token.id}
                        className="inline-block bg-gray-300 rounded-sm mx-px align-middle cursor-default"
                        style={{
                            width: `${token.length}ch`,
                            height: "1.15em",
                        }}
                        title={`${token.length} lettre${token.length > 1 ? "s" : ""}`}
                    />
                );
            })}
        </>
    );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function Game() {
    const [article, setArticle] = useState<MaskedArticle | null>(null);
    const [guesses, setGuesses] = useState<StoredGuess[]>([]);
    const [revealed, setRevealed] = useState<RevealedMap>({});
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [guessing, setGuessing] = useState(false);
    const [won, setWon] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastGuessFound, setLastGuessFound] = useState<boolean | null>(null);
    const [lastRevealedWord, setLastRevealedWord] = useState<string | null>(
        null,
    );
    const inputRef = useRef<HTMLInputElement>(null);

    // Stats dérivées
    const revealedCount = Object.keys(revealed).length;
    const totalWords = article?.totalWords ?? 0;
    const pct =
        totalWords > 0 ? Math.round((revealedCount / totalWords) * 100) : 0;

    // ─── Win check ───────────────────────────────────────────────────────

    const checkWin = useCallback(
        (art: MaskedArticle, rev: RevealedMap): boolean => {
            const titleWordTokens = art.articleTitleTokens.filter(
                (t): t is WordToken => t.type === "word",
            );
            return (
                titleWordTokens.length > 0 &&
                titleWordTokens.every(
                    (t) => rev[posKey(-1, "title", t.index)] !== undefined,
                )
            );
        },
        [],
    );

    // ─── Chargement initial ──────────────────────────────────────────────

    useEffect(() => {
        fetch("/api/game")
            .then((res) => {
                if (!res.ok) throw new Error("Erreur serveur");
                return res.json();
            })
            .then((data: MaskedArticle) => {
                setArticle(data);

                // Nettoyer les anciens caches
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const k = localStorage.key(i);
                    if (
                        k?.startsWith(STORAGE_KEY_PREFIX) &&
                        k !== `${STORAGE_KEY_PREFIX}${data.date}`
                    ) {
                        localStorage.removeItem(k);
                    }
                }

                // Restaurer le cache du jour
                const raw = localStorage.getItem(
                    `${STORAGE_KEY_PREFIX}${data.date}`,
                );
                if (raw) {
                    try {
                        const cache: GameCache = JSON.parse(raw);
                        setGuesses(cache.guesses ?? []);
                        setRevealed(cache.revealed ?? {});
                        if (checkWin(data, cache.revealed ?? {})) {
                            setWon(true);
                        }
                    } catch {
                        /* cache corrompu, on l'ignore */
                    }
                }

                setLoading(false);
            })
            .catch(() => {
                setError("Impossible de charger l'article du jour");
                setLoading(false);
            });
    }, [checkWin]);

    // ─── Sauvegarde localStorage ─────────────────────────────────────────

    const save = useCallback(
        (g: StoredGuess[], r: RevealedMap) => {
            if (!article) return;
            const cache: GameCache = { guesses: g, revealed: r };
            localStorage.setItem(
                `${STORAGE_KEY_PREFIX}${article.date}`,
                JSON.stringify(cache),
            );
        },
        [article],
    );

    // ─── Soumission d'un mot ─────────────────────────────────────────────

    const handleGuess = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !article || guessing || won) return;

        const raw = input.trim();
        const normalized = raw
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        // Déjà deviné ?
        if (guesses.some((g) => g.word === normalized)) {
            setInput("");
            return;
        }

        setGuessing(true);
        setLastGuessFound(null);
        setLastRevealedWord(null);

        try {
            const res = await fetch("/api/game/guess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word: raw }),
            });

            if (!res.ok) throw new Error("Erreur serveur");

            const result: GuessResult = await res.json();

            const newGuess: StoredGuess = {
                word: result.word,
                found: result.found,
                occurrences: result.occurrences,
            };

            const newGuesses = [newGuess, ...guesses];
            const newRevealed = { ...revealed };
            for (const pos of result.positions) {
                newRevealed[posKey(pos.section, pos.part, pos.wordIndex)] =
                    pos.display;
            }

            setGuesses(newGuesses);
            setRevealed(newRevealed);
            setLastGuessFound(result.found);
            if (result.found) {
                setLastRevealedWord(result.word);
                // Effacer le highlight après 1.5s
                setTimeout(() => setLastRevealedWord(null), 1500);
            }
            save(newGuesses, newRevealed);

            if (checkWin(article, newRevealed)) {
                setWon(true);
            }
        } catch {
            setError("Erreur lors de la soumission");
        } finally {
            setGuessing(false);
            setInput("");
            inputRef.current?.focus();
        }
    };

    // ─── Rendu ───────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-gray-500 text-lg animate-pulse">
                    Chargement de l&apos;article du jour…
                </p>
            </div>
        );
    }

    if (error && !article) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    if (!article) return null;

    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            {/* ─── Header fixe ───────────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
                    {/* Ligne titre + stats */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <h1 className="text-xl font-extrabold tracking-tight text-gray-800">
                            WikiGuessr
                        </h1>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{article.date}</span>
                            <span className="hidden sm:inline">·</span>
                            <span>
                                {guesses.length} essai
                                {guesses.length !== 1 && "s"}
                            </span>
                            <span className="hidden sm:inline">·</span>
                            <span>{pct}% révélé</span>
                        </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                        />
                    </div>

                    {/* Input ou victoire */}
                    {won ? (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-center">
                            <p className="text-emerald-800 font-bold text-lg">
                                Bravo ! Trouvé en {guesses.length} essai
                                {guesses.length !== 1 && "s"} !
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleGuess} className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    setLastGuessFound(null);
                                }}
                                placeholder="Devinez un mot…"
                                className={[
                                    "flex-1 px-4 py-2 border rounded-lg text-sm transition-colors",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-400",
                                    lastGuessFound === false
                                        ? "border-red-300 bg-red-50"
                                        : lastGuessFound === true
                                          ? "border-emerald-300 bg-emerald-50"
                                          : "border-gray-300",
                                ].join(" ")}
                                disabled={guessing}
                            />
                            <button
                                type="submit"
                                disabled={guessing || !input.trim()}
                                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {guessing ? "…" : "Deviner"}
                            </button>
                        </form>
                    )}
                </div>
            </header>

            {/* ─── Corps ─────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
                {/* Article */}
                <main className="flex-1 min-w-0 space-y-4">
                    {/* Titre de l'article */}
                    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold leading-[2.2]">
                            <TokenList
                                tokens={article.articleTitleTokens}
                                section={-1}
                                part="title"
                                revealed={revealed}
                                lastRevealedWord={lastRevealedWord}
                            />
                        </h2>
                    </div>

                    {/* Sections */}
                    {article.sections.map((sec) => {
                        const sectionKey =
                            sec.titleTokens[0]?.id ??
                            sec.contentTokens[0]?.id ??
                            "empty";
                        const sIdx = article.sections.indexOf(sec);
                        return (
                            <section
                                key={sectionKey}
                                className="p-5 bg-white rounded-xl shadow-sm border border-gray-100"
                            >
                                <h3 className="text-lg font-semibold mb-2 leading-[2.2]">
                                    <TokenList
                                        tokens={sec.titleTokens}
                                        section={sIdx}
                                        part="title"
                                        revealed={revealed}
                                        lastRevealedWord={lastRevealedWord}
                                    />
                                </h3>
                                <div className="text-sm leading-[2.2]">
                                    <TokenList
                                        tokens={sec.contentTokens}
                                        section={sIdx}
                                        part="content"
                                        revealed={revealed}
                                        lastRevealedWord={lastRevealedWord}
                                    />
                                </div>
                            </section>
                        );
                    })}
                </main>

                {/* ─── Liste des essais ────────────────────────── */}
                <aside className="lg:w-72 w-full shrink-0">
                    <div className="sticky top-36 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                            Essais ({guesses.length})
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
                            {guesses.length === 0 ? (
                                <p className="p-4 text-center text-gray-400 text-xs">
                                    Aucun essai
                                </p>
                            ) : (
                                guesses.map((g, i) => (
                                    <div
                                        key={`${g.word}-${i}`}
                                        className={[
                                            "flex items-center justify-between px-4 py-1.5 text-sm",
                                            g.found
                                                ? "bg-emerald-50/60"
                                                : "bg-red-50/60",
                                        ].join(" ")}
                                    >
                                        <span
                                            className={
                                                g.found
                                                    ? "text-emerald-800"
                                                    : "text-red-400 line-through"
                                            }
                                        >
                                            {g.word}
                                        </span>
                                        {g.found && (
                                            <span className="text-emerald-600 font-mono text-xs">
                                                ×{g.occurrences}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
