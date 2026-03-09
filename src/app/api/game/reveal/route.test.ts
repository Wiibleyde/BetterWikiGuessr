import { describe, expect, it, mock } from "bun:test";

const verifyWinMock = mock();
const getAllWordPositionsMock = mock();

mock.module("@/lib/game/game", () => ({
    verifyWin: verifyWinMock,
    getAllWordPositions: getAllWordPositionsMock,
}));

const { POST } = await import("./route");

function createRequest(body: unknown): Request {
    return new Request("http://localhost/api/game/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

describe("POST /api/game/reveal", () => {
    it("retourne 400 si la liste de mots est absente", async () => {
        const response = await POST(createRequest({}));
        const body = (await response.json()) as { error: string };

        expect(response.status).toBe(400);
        expect(body.error).toBe("Liste de mots requise");
    });

    it("retourne 403 si la victoire n'est pas vérifiée", async () => {
        verifyWinMock.mockResolvedValue(false);

        const response = await POST(createRequest({ words: ["tour"] }));
        const body = (await response.json()) as { error: string };

        expect(response.status).toBe(403);
        expect(body.error).toBe("Victoire non vérifiée");
    });

    it("retourne les positions quand la victoire est validée", async () => {
        verifyWinMock.mockResolvedValue(true);
        getAllWordPositionsMock.mockResolvedValue([
            { section: 0, part: "title", wordIndex: 0, display: "Tour" },
        ]);

        const response = await POST(
            createRequest({ words: ["tour", "eiffel"] }),
        );
        const body = (await response.json()) as {
            positions: Array<{ display: string }>;
        };

        expect(response.status).toBe(200);
        expect(body.positions).toHaveLength(1);
        expect(body.positions[0]?.display).toBe("Tour");
    });
});
