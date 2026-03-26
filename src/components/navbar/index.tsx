"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Button from "../ui/Button";
import NavbarAuth from "./NavbarAuth";
import NavbarButton from "./NavbarButton";

const NAV_LINKS = [
    { href: "/", label: "Jouer" },
    { href: "/coop", label: "Co-op" },
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
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-y-2">
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
                </div>

                <NavbarButton open={open} setOpen={setOpen} />
                <div
                    className={`w-full border-t border-gray-200 pt-2 ${open ? "flex" : "hidden"} md:flex md:flex-row flex-col md:items-center md:gap-3 md:w-auto md:border-t-0 md:pt-0`}
                >
                    <nav className="flex flex-col gap-1 md:flex-row md:items-center">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                            >
                                <Button
                                    className={`w-full text-left md:w-auto md:text-center ${pathname === link.href ? "bg-gray-100 text-gray-900" : ""}`}
                                    variant="navbar"
                                >
                                    {link.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-3 border-t border-gray-100 px-0 pt-3 md:mt-0 md:border-t-0 md:pt-0 md:flex md:items-center sm:gap-3">
                        <NavbarAuth
                            user={user}
                            loading={loading}
                            onLogin={login}
                            open={open}
                            setOpen={setOpen}
                            mobile={open}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
