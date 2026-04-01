"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useState } from "react";
import { NAV_LINKS, providers } from "@/constants/navbar";
import LoginContext from "@/context/LoginContext";
import { useAuth } from "@/hooks/useAuth";
import ButtonProvider from "../ui/ButtonProvider";
import Modal from "../ui/Modal";
import NavbarLink from "../ui/NavbarLink";
import NavbarAuth from "./NavbarAuth";
import NavbarButton from "./NavbarButton";

export default function Navbar() {
    const { user, loading } = useAuth();
    const [open, setOpen] = useState<boolean>(false);
    const { setShowLogin, showLogin } = useContext(LoginContext);
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
                        {NAV_LINKS.map((link) => {
                            const inCoopGame =
                                pathname.startsWith("/coop/") &&
                                link.href === "/coop";
                            const isCoop =
                                pathname.startsWith("/coop") &&
                                link.href === "/coop";
                            const isActive = isCoop
                                ? pathname.startsWith("/coop")
                                : pathname === link.href;
                            const href = inCoopGame ? pathname : link.href;
                            return (
                                <NavbarLink
                                    key={link.href}
                                    href={href}
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
                                setShowLogin(true);
                            }}
                            open={open}
                            setOpen={setOpen}
                            mobile={open}
                        />
                    </div>
                </div>
            </div>

            <Modal
                setOpen={setShowLogin}
                open={showLogin}
                onClose={() => setShowLogin(false)}
                title="Se connecter"
                subtitle="Choisissez un fournisseur pour continuer"
            >
                {providers.map((provider) => (
                    <ButtonProvider
                        key={provider.name}
                        onClose={() => setShowLogin(false)}
                        {...provider}
                    />
                ))}
            </Modal>
        </header>
    );
}
