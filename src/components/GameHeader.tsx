"use client";

import Image from "next/image";
import type { FormEvent, RefObject } from "react";
import type { AuthUser } from "@/types/auth";

interface GameHeaderProps {
    date: string;
    guessCount: number;
    percentage: number;
    won: boolean;
    guessing: boolean;
    input: string;
    lastGuessFound: boolean | null;
    lastGuessSimilarity: number;
    inputRef: RefObject<HTMLInputElement | null>;
    user: AuthUser | null;
    authLoading: boolean;
    onLogin: () => void;
    onLogout: () => void;
    onInputChange: (value: string) => void;
    onSubmit: (e?: FormEvent) => void;
}

export default function GameHeader({
    date,
    guessCount,
    percentage,
    won,
    guessing,
    input,
    lastGuessFound,
    lastGuessSimilarity,
    inputRef,
    user,
    authLoading,
    onLogin,
    onLogout,
    onInputChange,
    onSubmit,
}: GameHeaderProps) {
    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-3 space-y-2">
                <div className="flex items-center gap-4 flex-wrap">
                    <h1 className="text-xl font-extrabold tracking-tight text-gray-800">
                        WikiGuessr
                    </h1>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{date}</span>
                        <span className="hidden sm:inline">·</span>
                        <span>
                            {guessCount} essai{guessCount !== 1 && "s"}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span>{percentage}% révélé</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {authLoading ? null : user ? (
                            <>
                                {user.avatar && (
                                    <Image
                                        src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=32`}
                                        alt=""
                                        width={24}
                                        height={24}
                                        className="w-6 h-6 rounded-full"
                                    />
                                )}
                                <a
                                    href="/profile"
                                    className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    {user.username}
                                </a>
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onLogin}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Connexion Discord
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                {won ? (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-center">
                        <p className="text-emerald-800 font-bold text-lg">
                            Bravo ! Trouvé en {guessCount} essai
                            {guessCount !== 1 && "s"} !
                        </p>
                    </div>
                ) : (
                    <form onSubmit={onSubmit} className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder="Devinez un mot…"
                            className={[
                                "flex-1 px-4 py-2 border rounded-lg text-sm transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-blue-400",
                                lastGuessFound === false &&
                                lastGuessSimilarity >= 0.55
                                    ? "border-amber-400 bg-amber-50"
                                    : lastGuessFound === false
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
    );
}
