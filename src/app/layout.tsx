import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/ui/Footer";

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
    return (
        <html lang="fr">
            <body className="antialiased m-0 p-0 min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
                <SpeedInsights />
            </body>
        </html>
    );
}
