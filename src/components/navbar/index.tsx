"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_LINKS } from "@/constants/navbar";
import { useAuth } from "@/hooks/useAuth";
import LoginModal, { type LoginProvider } from "../ui/LoginModal";
import NavbarLink from "../ui/NavbarLink";
import NavbarAuth from "./NavbarAuth";
import NavbarButton from "./NavbarButton";

const DiscordIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 127.14 96.36"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden="true"
    >
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
);

export default function Navbar() {
    const { user, loading, login } = useAuth();
    const [open, setOpen] = useState<boolean>(false);
    const [loginOpen, setLoginOpen] = useState<boolean>(false);
    const pathname = usePathname();

    const providers: LoginProvider[] = [
        {
            id: "discord",
            label: "Continuer avec Discord",
            icon: <DiscordIcon />,
            onClick: () => login("discord"),
            className: "bg-[#5865F2] text-white hover:bg-[#4752c4]",
        },
    ];

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
                        {NAV_LINKS.map((link) => {
                            const isCoop =
                                pathname.startsWith("/coop") &&
                                link.href === "/coop";
                            const isActive = isCoop
                                ? pathname.startsWith("/coop")
                                : pathname === link.href;
                            return (
                                <NavbarLink
                                    key={link.href}
                                    href={link.href}
                                    label={link.label}
                                    isActive={isActive}
                                    onClick={() => setOpen(false)}
                                />
                            );
                        })}
                    </nav>

                    <div className="mt-3 border-t border-gray-100 px-0 pt-3 md:mt-0 md:border-t-0 md:pt-0 md:flex md:items-center sm:gap-3">
                        <NavbarAuth
                            user={user}
                            loading={loading}
                            onOpenLoginModal={() => {
                                setOpen(false);
                                setLoginOpen(true);
                            }}
                            open={open}
                            setOpen={setOpen}
                            mobile={open}
                        />
                    </div>
                </div>
            </div>

            <LoginModal
                open={loginOpen}
                onClose={() => setLoginOpen(false)}
                providers={providers}
            />
        </header>
    );
}
