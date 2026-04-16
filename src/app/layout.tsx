import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { connection } from "next/server";
import "./globals.css";
import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/ui/Footer";
import env from "@/env";
import LoginProvider from "@/provider/LoginProvider";
import QueryProvider from "@/provider/QueryProvider";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-body",
    display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-heading",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Wiki Guessr",
    description:
        "Un jeu où vous devez deviner la page Wikipédia en donnant des mots !",
    authors: [
        { name: "Nathan Bonnell", url: "https://nathan.bonnell.fr" },
        { name: "Mathéo Lang", url: "https://matheolang.fr" },
    ],
    keywords: [
        "wiki guessr",
        "wikiguessr",
        "jeu",
        "wikipedia",
        "deviner",
        "mots",
        "indices",
        "challenge",
        "culture générale",
        "coop",
    ],
    category: "game",
    classification: "general",
    creator: "Nathan Bonnell et Mathéo Lang",
    robots: {
        index: true,
        follow: true,
    },
    verification: {
        google: "google-site-verification=a4uoCtPLK4IRbmmpoko6el3U8PAeRUvlnEWAcBFi0NA",
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    await connection();

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
        env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const runtimeConfig = JSON.stringify({
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    }).replace(/</g, "\\u003c");

    return (
        <html lang="fr" className={`${inter.variable} ${jakarta.variable}`}>
            <body className="font-(family-name:--font-body) antialiased m-0 p-0 min-h-screen h-screen flex flex-col bg-page text-text">
                <Script
                    id="runtime-config"
                    strategy="beforeInteractive"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional runtime env injection for Docker deployments; values come from server env vars, not user input
                    dangerouslySetInnerHTML={{
                        __html: `window.__WIKIGUESSR_ENV__ = ${runtimeConfig};`,
                    }}
                />
                <QueryProvider>
                    <LoginProvider>
                        <a href="#main-content" className="skip-nav">
                            Aller au contenu principal
                        </a>
                        <Navbar />
                        <main id="main-content" className="flex-1">
                            {children}
                        </main>
                        <Footer />
                    </LoginProvider>
                </QueryProvider>
            </body>
        </html>
    );
}
