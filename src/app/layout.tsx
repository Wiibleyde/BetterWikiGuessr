import type { Metadata } from "next";
import Script from "next/script";
import { connection } from "next/server";
import "./globals.css";
import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/ui/Footer";
import env from "@/env";
import LoginProvider from "@/provider/LoginProvider";

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
        <html lang="fr">
            <body className="antialiased m-0 p-0 min-h-screen h-screen flex flex-col">
                <Script
                    id="runtime-config"
                    strategy="beforeInteractive"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional runtime env injection for Docker deployments; values come from server env vars, not user input
                    dangerouslySetInnerHTML={{
                        __html: `window.__WIKIGUESSR_ENV__ = ${runtimeConfig};`,
                    }}
                />
                <LoginProvider>
                    <Navbar />
                    <main className="flex-1">{children}</main>
                    <Footer />
                </LoginProvider>
            </body>
        </html>
    );
}
