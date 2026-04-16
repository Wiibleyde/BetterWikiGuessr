import axios from "axios";

export interface FetcherOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    validateStatus?: (status: number) => boolean;
    headers?: Record<string, string>;
}

export async function fetcher<T>(
    url: string,
    options?: FetcherOptions,
): Promise<T> {
    try {
        const response = await axios({
            url,
            method: options?.method || "GET",
            data: options?.body,
            validateStatus: options?.validateStatus,
            headers: options?.headers,
        });
        return response.data;
    } catch (error) {
        throw new Error("Erreur serveur", { cause: error });
    }
}

export async function fetchWikiPagePart<T>(url: string): Promise<T> {
    try {
        const response = await axios.get<T>(url, {
            headers: {
                // Requis sinon 403 sur l'api de Wikipédia
                "User-Agent": "WikiGuessr/1.0 (https://wikiguessr.com)",
            },
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            throw new Error(
                `[wiki] HTTP ${error.response.status} fetching ${url}`,
            );
        }
        throw error;
    }
}
