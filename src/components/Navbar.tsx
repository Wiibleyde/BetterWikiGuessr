"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import NavbarAuth from "./navbar/NavbarAuth";
import NavbarButton from "./navbar/NavbarButton";
import Button from "./ui/Button";

const NAV_LINKS = [
    { href: "/", label: "Jouer" },
    { href: "/historic", label: "Historique" },
    { href: "/leaderboard", label: "Classement" },
    { href: "/profile", label: "Profil" },
] as const;

export default function Navbar() {
    const { user, loading, login } = useAuth();
    const [open, setOpen] = useState<boolean>(false);
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Image
                        src="/logo-wikiguessr.svg"
                        alt="WikiGuessr logo"
                        width={32}
                        height={32}
                    />
                    <Link
                        href="/"
                        className="text-xl font-extrabold tracking-tight text-gray-800 hover:text-gray-600 transition-colors"
                    >
                        WikiGuessr
                    </Link>

                    <nav className="hidden sm:flex items-center gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                                <Button
                                    className={
                                        pathname === link.href
                                            ? "bg-gray-100 text-gray-900"
                                            : ""
                                    }
                                    variant="navbar"
                                >
                                    {link.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Desktop auth */}
                <div className="hidden sm:flex items-center gap-3">
                    <NavbarAuth
                        user={user}
                        loading={loading}
                        onLogin={login}
                        open={open}
                        setOpen={setOpen}
                    />
                </div>

                <NavbarButton
                    open={open}
                    setOpen={setOpen}
                />
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="sm:hidden border-t border-gray-200 bg-white">
                    <nav className="flex flex-col px-4 py-2 gap-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                            >

                                <Button
                                    className={`text-left w-full ${pathname === link.href ? "bg-gray-100 text-gray-900" : ""}`}
                                    variant="navbar">
                                    {link.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                    <div className="px-4 py-3 border-t border-gray-100">
                        <NavbarAuth
                            user={user}
                            loading={loading}
                            onLogin={login}
                            open={open}
                            setOpen={setOpen}
                            mobile
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
