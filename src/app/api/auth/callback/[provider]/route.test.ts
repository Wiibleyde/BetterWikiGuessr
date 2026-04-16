import { afterEach, describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import { exchangeCodeForSessionMock } from "@/test/mocks/authModule";
import "@/test/mocks/authModule";

const { GET } = await import("./route");

describe("GET /api/auth/callback/[provider]", () => {
    afterEach(() => {
        exchangeCodeForSessionMock.mockClear();
        exchangeCodeForSessionMock.mockResolvedValue({
            data: {},
            error: null,
        });
    });

    it("redirige vers SITE_URL après un échange OAuth réussi", async () => {
        const response = await GET(
            new NextRequest(
                "http://0.0.0.0:3000/api/auth/callback/discord?code=test-code&next=/profile",
            ),
        );

        expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("test-code");
        expect(response.headers.get("location")).toBe(
            "https://wikiguessr.example.com/profile",
        );
    });
});
