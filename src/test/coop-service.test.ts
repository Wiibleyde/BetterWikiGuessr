import { beforeEach, describe, expect, it, mock } from "bun:test";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const createLobbyMock = mock();
const getLobbyByCodeMock = mock();
const addPlayerMock = mock();
const getPlayerByTokenMock = mock();
const setLobbyWikiPageMock = mock();
const updateLobbyStatusMock = mock();
const getPlayerCountMock = mock();
const addGuessMock = mock();
const getFoundGuessWordsMock = mock();
const getAllGuessedWordsMock = mock();
const removePlayerMock = mock();
const transferLeadershipMock = mock();
const deleteLobbyMock = mock();

mock.module("@/lib/repositories/coopRepository", () => ({
    createLobby: createLobbyMock,
    getLobbyByCode: getLobbyByCodeMock,
    addPlayer: addPlayerMock,
    getPlayerByToken: getPlayerByTokenMock,
    setLobbyWikiPage: setLobbyWikiPageMock,
    updateLobbyStatus: updateLobbyStatusMock,
    getPlayerCount: getPlayerCountMock,
    addGuess: addGuessMock,
    getFoundGuessWords: getFoundGuessWordsMock,
    getAllGuessedWords: getAllGuessedWordsMock,
    removePlayer: removePlayerMock,
    transferLeadership: transferLeadershipMock,
    deleteLobby: deleteLobbyMock,
}));

const broadcastToLobbyMock = mock();
const removeCoopChannelMock = mock();

mock.module("@/lib/supabase/broadcast", () => ({
    broadcastToLobby: broadcastToLobbyMock,
    removeCoopChannel: removeCoopChannelMock,
}));

const fetchRandomWikiPageMock = mock();

mock.module("@/lib/game/wiki", () => ({
    fetchRandomWikiPage: fetchRandomWikiPageMock,
}));

const {
    createCoopLobby,
    joinCoopLobby,
    leaveLobby,
    startCoopGame,
    submitCoopGuess,
    getCoopLobbyState,
} = await import("@/lib/services/coopService");

const {
    LobbyNotFoundError,
    LobbyFullError,
    LobbyFinishedError,
    NotLeaderError,
    GameAlreadyStartedError,
    GameNotStartedError,
} = await import("@/lib/errors/coopError");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeLobby(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        code: "ABC123",
        status: "waiting",
        maxPlayers: 8,
        createdAt: new Date("2026-03-31T12:00:00Z"),
        wikiTitle: null,
        wikiSections: null,
        wikiImages: [],
        wikiUrl: null,
        players: [
            {
                id: 10,
                displayName: "Alice",
                isLeader: true,
                token: "tok-alice",
                userId: "user-1",
            },
        ],
        guesses: [],
        ...overrides,
    };
}

function makePlayer(overrides: Record<string, unknown> = {}) {
    return {
        id: 10,
        displayName: "Alice",
        isLeader: true,
        token: "tok-alice",
        lobbyId: 1,
        lobby: makeLobby(),
        ...overrides,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("createCoopLobby", () => {
    beforeEach(() => {
        createLobbyMock.mockReset();
    });

    it("creates a lobby and returns playerToken", async () => {
        createLobbyMock.mockResolvedValue({
            ...makeLobby(),
            players: [
                {
                    id: 10,
                    displayName: "Alice",
                    isLeader: true,
                    token: "tok-alice",
                },
            ],
        });

        const result = await createCoopLobby("Alice", "user-1");

        expect(result.lobby).toBeDefined();
        expect(result.player).toBeDefined();
        expect(result.playerToken).toBeTypeOf("string");
        expect(createLobbyMock).toHaveBeenCalledTimes(1);
    });
});

describe("joinCoopLobby", () => {
    beforeEach(() => {
        getLobbyByCodeMock.mockReset();
        addPlayerMock.mockReset();
        broadcastToLobbyMock.mockReset();
    });

    it("throws LobbyNotFoundError when lobby does not exist", async () => {
        getLobbyByCodeMock.mockResolvedValue(null);
        expect(joinCoopLobby("NOPE", "Bob")).rejects.toBeInstanceOf(
            LobbyNotFoundError,
        );
    });

    it("throws LobbyFinishedError when lobby is finished", async () => {
        getLobbyByCodeMock.mockResolvedValue(makeLobby({ status: "finished" }));
        expect(joinCoopLobby("ABC123", "Bob")).rejects.toBeInstanceOf(
            LobbyFinishedError,
        );
    });

    it("returns existing player if authenticated user already in lobby", async () => {
        const lobby = makeLobby({
            players: [
                {
                    id: 10,
                    displayName: "Alice",
                    isLeader: true,
                    token: "tok-alice",
                    userId: "user-1",
                },
            ],
        });
        getLobbyByCodeMock.mockResolvedValue(lobby);

        const result = await joinCoopLobby("ABC123", "Alice", "user-1");
        expect(result.player.id).toBe(10);
        expect(addPlayerMock).not.toHaveBeenCalled();
    });

    it("throws LobbyFullError when lobby is at max capacity", async () => {
        const players = Array.from({ length: 8 }, (_, i) => ({
            id: i + 1,
            displayName: `P${i}`,
            isLeader: i === 0,
            token: `tok-${i}`,
        }));
        getLobbyByCodeMock.mockResolvedValue(
            makeLobby({ players, maxPlayers: 8 }),
        );
        expect(joinCoopLobby("ABC123", "Extra")).rejects.toBeInstanceOf(
            LobbyFullError,
        );
    });

    it("adds a new player and broadcasts", async () => {
        getLobbyByCodeMock.mockResolvedValue(makeLobby());
        addPlayerMock.mockResolvedValue({
            id: 20,
            displayName: "Bob",
            isLeader: false,
        });
        broadcastToLobbyMock.mockResolvedValue(undefined);

        const result = await joinCoopLobby("ABC123", "Bob");

        expect(result.player.id).toBe(20);
        expect(addPlayerMock).toHaveBeenCalledTimes(1);
        expect(broadcastToLobbyMock).toHaveBeenCalledWith(
            "ABC123",
            "player_joined",
            expect.objectContaining({ playerId: 20, displayName: "Bob" }),
        );
    });
});

describe("startCoopGame", () => {
    beforeEach(() => {
        getPlayerByTokenMock.mockReset();
        getLobbyByCodeMock.mockReset();
        fetchRandomWikiPageMock.mockReset();
        setLobbyWikiPageMock.mockReset();
        broadcastToLobbyMock.mockReset();
    });

    it("throws LobbyNotFoundError when player token is invalid", async () => {
        getPlayerByTokenMock.mockResolvedValue(null);
        expect(startCoopGame("ABC123", "bad-tok")).rejects.toBeInstanceOf(
            LobbyNotFoundError,
        );
    });

    it("throws NotLeaderError when player is not leader", async () => {
        getPlayerByTokenMock.mockResolvedValue(makePlayer({ isLeader: false }));
        expect(startCoopGame("ABC123", "tok-alice")).rejects.toBeInstanceOf(
            NotLeaderError,
        );
    });

    it("throws GameAlreadyStartedError when status is not waiting", async () => {
        getPlayerByTokenMock.mockResolvedValue(makePlayer());
        getLobbyByCodeMock.mockResolvedValue(makeLobby({ status: "playing" }));
        expect(startCoopGame("ABC123", "tok-alice")).rejects.toBeInstanceOf(
            GameAlreadyStartedError,
        );
    });

    it("starts the game and broadcasts the article", async () => {
        getPlayerByTokenMock.mockResolvedValue(makePlayer());
        getLobbyByCodeMock.mockResolvedValue(makeLobby());
        fetchRandomWikiPageMock.mockResolvedValue({
            title: "Tour Eiffel",
            sections: [
                {
                    title: "Tour Eiffel",
                    content: "La tour domine Paris.",
                },
            ],
            images: ["https://example.com/img.jpg"],
            url: "https://fr.wikipedia.org/wiki/Tour_Eiffel",
        });
        setLobbyWikiPageMock.mockResolvedValue(undefined);
        broadcastToLobbyMock.mockResolvedValue(undefined);

        const article = await startCoopGame("ABC123", "tok-alice");

        expect(article).toBeDefined();
        expect(article.totalWords).toBeGreaterThan(0);
        expect(broadcastToLobbyMock).toHaveBeenCalledWith(
            "ABC123",
            "game_started",
            expect.objectContaining({ article: expect.any(Object) }),
        );
    });
});

describe("submitCoopGuess", () => {
    beforeEach(() => {
        getPlayerByTokenMock.mockReset();
        getLobbyByCodeMock.mockReset();
        getFoundGuessWordsMock.mockReset();
        getAllGuessedWordsMock.mockReset();
        addGuessMock.mockReset();
        broadcastToLobbyMock.mockReset();
        updateLobbyStatusMock.mockReset();
        getPlayerCountMock.mockReset();
        removeCoopChannelMock.mockReset();

        // Pre-build cache for submitting guesses
        const { removeCoopCache, getOrBuildCoopCache } =
            require("@/lib/game/coop-game") as typeof import("@/lib/game/coop-game");
        removeCoopCache("ABC123");
        getOrBuildCoopCache(
            "ABC123",
            "Tour Eiffel",
            [
                {
                    title: "Tour Eiffel",
                    content: "La tour domine Paris.",
                },
            ],
            "2026-03-31",
        );
    });

    it("throws LobbyNotFoundError when player token is invalid", async () => {
        getPlayerByTokenMock.mockResolvedValue(null);
        expect(
            submitCoopGuess("ABC123", "bad-tok", "tour"),
        ).rejects.toBeInstanceOf(LobbyNotFoundError);
    });

    it("throws GameNotStartedError when lobby is waiting", async () => {
        getPlayerByTokenMock.mockResolvedValue(makePlayer());
        getLobbyByCodeMock.mockResolvedValue(makeLobby({ status: "waiting" }));
        expect(
            submitCoopGuess("ABC123", "tok-alice", "tour"),
        ).rejects.toBeInstanceOf(GameNotStartedError);
    });

    it("submits a correct guess and broadcasts", async () => {
        getPlayerByTokenMock.mockResolvedValue(makePlayer());
        getLobbyByCodeMock.mockResolvedValue(
            makeLobby({
                status: "playing",
                wikiTitle: "Tour Eiffel",
                wikiSections: [
                    {
                        title: "Tour Eiffel",
                        content: "La tour domine Paris.",
                    },
                ],
            }),
        );
        getFoundGuessWordsMock.mockResolvedValue([]);
        getAllGuessedWordsMock.mockResolvedValue([]);
        addGuessMock.mockResolvedValue({
            id: 1,
            createdAt: new Date("2026-03-31T12:05:00Z"),
        });
        broadcastToLobbyMock.mockResolvedValue(undefined);

        const { guessResult, won } = await submitCoopGuess(
            "ABC123",
            "tok-alice",
            "tour",
        );

        expect(guessResult.found).toBe(true);
        expect(guessResult.word).toBe("tour");
        expect(won).toBe(false);
        expect(broadcastToLobbyMock).toHaveBeenCalledWith(
            "ABC123",
            "guess_result",
            expect.objectContaining({
                guess: expect.objectContaining({ word: "tour", found: true }),
            }),
        );
    });
});

describe("getCoopLobbyState", () => {
    beforeEach(() => {
        getLobbyByCodeMock.mockReset();
    });

    it("throws LobbyNotFoundError when lobby does not exist", async () => {
        getLobbyByCodeMock.mockResolvedValue(null);
        expect(getCoopLobbyState("NOPE")).rejects.toBeInstanceOf(
            LobbyNotFoundError,
        );
    });

    it("returns lobby state with players and guesses", async () => {
        getLobbyByCodeMock.mockResolvedValue(
            makeLobby({
                players: [
                    {
                        id: 10,
                        displayName: "Alice",
                        isLeader: true,
                        token: "tok-alice",
                    },
                ],
                guesses: [
                    {
                        id: 1,
                        word: "tour",
                        found: true,
                        occurrences: 2,
                        similarity: 1,
                        positions: [],
                        playerId: 10,
                        player: { id: 10, displayName: "Alice" },
                        createdAt: new Date("2026-03-31T12:05:00Z"),
                    },
                ],
            }),
        );

        const state = await getCoopLobbyState("ABC123");

        expect(state.lobby.code).toBe("ABC123");
        expect(state.players).toHaveLength(1);
        expect(state.players[0].guessCount).toBe(1);
        expect(state.guesses).toHaveLength(1);
        expect(state.guesses[0].word).toBe("tour");
    });

    it("returns article when lobby is playing", async () => {
        getLobbyByCodeMock.mockResolvedValue(
            makeLobby({
                status: "playing",
                wikiTitle: "Tour Eiffel",
                wikiSections: [
                    {
                        title: "Tour Eiffel",
                        content: "La tour domine Paris.",
                    },
                ],
            }),
        );

        const state = await getCoopLobbyState("ABC123");

        expect(state.article).not.toBeNull();
        expect(state.article?.totalWords).toBeGreaterThan(0);
    });
});

describe("leaveLobby", () => {
    beforeEach(() => {
        getPlayerByTokenMock.mockReset();
        getLobbyByCodeMock.mockReset();
        removePlayerMock.mockReset();
        deleteLobbyMock.mockReset();
        transferLeadershipMock.mockReset();
        broadcastToLobbyMock.mockReset();
        removeCoopChannelMock.mockReset();
    });

    it("throws LobbyNotFoundError when player token is invalid", async () => {
        getPlayerByTokenMock.mockResolvedValue(null);
        expect(leaveLobby("ABC123", "bad-tok")).rejects.toBeInstanceOf(
            LobbyNotFoundError,
        );
    });

    it("throws LobbyNotFoundError when lobby does not exist", async () => {
        getPlayerByTokenMock.mockResolvedValue(makePlayer());
        getLobbyByCodeMock.mockResolvedValue(null);
        expect(leaveLobby("ABC123", "tok-alice")).rejects.toBeInstanceOf(
            LobbyNotFoundError,
        );
    });

    it("removes the player and broadcasts player_left", async () => {
        const lobby = makeLobby({
            players: [
                {
                    id: 10,
                    displayName: "Alice",
                    isLeader: true,
                    token: "tok-alice",
                    userId: "user-1",
                },
                {
                    id: 20,
                    displayName: "Bob",
                    isLeader: false,
                    token: "tok-bob",
                    userId: null,
                },
            ],
        });
        getPlayerByTokenMock.mockResolvedValue(
            makePlayer({
                id: 20,
                displayName: "Bob",
                isLeader: false,
                token: "tok-bob",
            }),
        );
        getLobbyByCodeMock.mockResolvedValue(lobby);
        removePlayerMock.mockResolvedValue(undefined);
        broadcastToLobbyMock.mockResolvedValue(undefined);

        const result = await leaveLobby("ABC123", "tok-bob");

        expect(result.deleted).toBe(false);
        expect(removePlayerMock).toHaveBeenCalledWith(20);
        expect(broadcastToLobbyMock).toHaveBeenCalledWith(
            "ABC123",
            "player_left",
            expect.objectContaining({ playerId: 20, displayName: "Bob" }),
        );
        expect(transferLeadershipMock).not.toHaveBeenCalled();
    });

    it("transfers leadership when leader leaves with other players", async () => {
        const lobby = makeLobby({
            players: [
                {
                    id: 10,
                    displayName: "Alice",
                    isLeader: true,
                    token: "tok-alice",
                    userId: "user-1",
                },
                {
                    id: 20,
                    displayName: "Bob",
                    isLeader: false,
                    token: "tok-bob",
                    userId: null,
                },
            ],
        });
        getPlayerByTokenMock.mockResolvedValue(makePlayer());
        getLobbyByCodeMock.mockResolvedValue(lobby);
        removePlayerMock.mockResolvedValue(undefined);
        transferLeadershipMock.mockResolvedValue(undefined);
        broadcastToLobbyMock.mockResolvedValue(undefined);

        const result = await leaveLobby("ABC123", "tok-alice");

        expect(result.deleted).toBe(false);
        expect(removePlayerMock).toHaveBeenCalledWith(10);
        expect(transferLeadershipMock).toHaveBeenCalledWith(1, 10, 20);
        expect(broadcastToLobbyMock).toHaveBeenCalledWith(
            "ABC123",
            "player_left",
            expect.objectContaining({ playerId: 10, displayName: "Alice" }),
        );
        expect(broadcastToLobbyMock).toHaveBeenCalledWith(
            "ABC123",
            "leader_changed",
            expect.objectContaining({
                newLeaderId: 20,
                displayName: "Bob",
            }),
        );
    });

    it("deletes lobby when last player leaves", async () => {
        const lobby = makeLobby({
            players: [
                {
                    id: 10,
                    displayName: "Alice",
                    isLeader: true,
                    token: "tok-alice",
                    userId: "user-1",
                },
            ],
        });
        getPlayerByTokenMock.mockResolvedValue(makePlayer());
        getLobbyByCodeMock.mockResolvedValue(lobby);
        removePlayerMock.mockResolvedValue(undefined);
        deleteLobbyMock.mockResolvedValue(undefined);
        removeCoopChannelMock.mockImplementation(() => {});

        const result = await leaveLobby("ABC123", "tok-alice");

        expect(result.deleted).toBe(true);
        expect(removePlayerMock).toHaveBeenCalledWith(10);
        expect(deleteLobbyMock).toHaveBeenCalledWith("ABC123");
        expect(broadcastToLobbyMock).not.toHaveBeenCalled();
    });
});
