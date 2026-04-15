// ─── Domain errors ────────────────────────────────────────────────────────────

export class LobbyNotFoundError extends Error {
    constructor() {
        super("Lobby introuvable");
        this.name = "LobbyNotFoundError";
    }
}

export class LobbyFullError extends Error {
    constructor() {
        super("Le lobby est plein");
        this.name = "LobbyFullError";
    }
}

export class LobbyFinishedError extends Error {
    constructor() {
        super("La partie est terminée");
        this.name = "LobbyFinishedError";
    }
}

export class NotLeaderError extends Error {
    constructor() {
        super("Seul le leader peut démarrer la partie");
        this.name = "NotLeaderError";
    }
}

export class GameAlreadyStartedError extends Error {
    constructor() {
        super("La partie a déjà commencé");
        this.name = "GameAlreadyStartedError";
    }
}

export class GameNotStartedError extends Error {
    constructor() {
        super("La partie n'a pas encore commencé");
        this.name = "GameNotStartedError";
    }
}
