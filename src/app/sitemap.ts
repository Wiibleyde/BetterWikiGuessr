import type { MetadataRoute } from "next";

export const BASE_URL = "https://better-wiki-guessr.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
    const pages = [
        { url: "/", lastModified: new Date() },
        { url: "/leaderboard", lastModified: new Date() },
    ];

    return pages.map((page) => {
        return {
            url: page.url,
            lastModified: page.lastModified.toISOString(),
            priority: getPriority(page.url),
        };
    });
}

function getPriority(url: string): number {
    if (url === "/") return 1.0; // Home page has the highest priority
    if (url === "/leaderboard") return 0.8; // Leaderboard is important but less than home
    return 0.5; // Other pages have a lower priority
}
