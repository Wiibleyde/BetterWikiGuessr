"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";
import NavbarContext from "@/contexts/NavbarContext";
import { useAuth } from "@/hooks/useAuth";
import DesktopLink from "./navbar/DesktopLink";
import MobileLink from "./navbar/MobileLink";

const NAV_LINKS = [
    { href: "/", label: "Jouer" },
    { href: "/historic", label: "Historique" },
    { href: "/leaderboard", label: "Classement" },
    { href: "/profile", label: "Profil" },
] as const;

export default function Navbar() {
    const { user, loading, login, logout } = useAuth();
    const { open, setOpen } = useContext(NavbarContext);

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="text-xl font-extrabold tracking-tight text-gray-800 hover:text-gray-600 transition-colors"
                    >
                        WikiGuessr
                    </Link>

                    <nav className="hidden sm:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <DesktopLink
                                key={link.href}
                                href={link.href}
                                label={link.label}
                            />
                        ))}
                    </nav>
                </div>

                {/* Desktop auth */}
                <div className="hidden sm:flex items-center gap-3">
                    {loading ? null : user ? (
                        <div className="flex items-center gap-3">
                            {user.avatar && (
                                <Image
                                    src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=32`}
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="w-7 h-7 rounded-full"
                                />
                            )}
                            <Link
                                href="/profile"
                                className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                            >
                                {user.username}
                            </Link>
                            <button
                                type="button"
                                onClick={logout}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                                Déconnexion
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={login}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Connexion Discord
                        </button>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
                    aria-label="Menu"
                    aria-expanded={open}
                >
                    <span
                        className={[
                            "block h-0.5 w-5 bg-gray-600 rounded transition-all duration-300 origin-center",
                            open ? "translate-y-2 rotate-45" : "",
                        ].join(" ")}
                    />
                    <span
                        className={[
                            "block h-0.5 w-5 bg-gray-600 rounded transition-all duration-300",
                            open ? "opacity-0 scale-0" : "",
                        ].join(" ")}
                    />
                    <span
                        className={[
                            "block h-0.5 w-5 bg-gray-600 rounded transition-all duration-300 origin-center",
                            open ? "-translate-y-2 -rotate-45" : "",
                        ].join(" ")}
                    />
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="sm:hidden border-t border-gray-200 bg-white">
                    <nav className="flex flex-col px-4 py-2 gap-1">
                        {NAV_LINKS.map((link) => (
                            <MobileLink
                                key={link.href}
                                href={link.href}
                                label={link.label}
                            />
                        ))}
                    </nav>
                    <div className="px-4 py-3 border-t border-gray-100">
                        {loading ? null : user ? (
                            <div className="flex items-center gap-3">
                                {user.avatar && (
                                    <Image
                                        src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=32`}
                                        alt=""
                                        width={28}
                                        height={28}
                                        className="w-7 h-7 rounded-full"
                                    />
                                )}
                                <Link
                                    href="/profile"
                                    onClick={() => setOpen(false)}
                                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    {user.username}
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => {
                                        logout();
                                        setOpen(false);
                                    }}
                                    className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    Déconnexion
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    login();
                                    setOpen(false);
                                }}
                                className="w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Connexion Discord
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
