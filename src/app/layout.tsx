import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/ui/Footer";
import env from "@/env";

export const metadata: Metadata = {
    title: "Wiki Guessr",
    description:
        "Un jeu où vous devez deviner la page Wikipédia en donnant des mots !",
    authors: [
        { name: "Nathan Bonnell", url: "https://nathan.bonnell.fr" },
        { name: "Mathéo Lang", url: "https://matheolang.fr" },
    ],
    keywords: [
        "jeu",
        "wikipedia",
        "deviner",
        "mots",
        "indices",
        "challenge",
        "culture générale",
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const runtimeConfig = JSON.stringify({
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }).replace(/</g, "\\u003c");

    return (
        <html lang="fr">
            <body className="antialiased m-0 p-0 min-h-screen flex flex-col">
                <Script
                    id="runtime-config"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `window.__WIKIGUESSR_ENV__ = ${runtimeConfig};`,
                    }}
                />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
            </body>
        </html>
    );
}
