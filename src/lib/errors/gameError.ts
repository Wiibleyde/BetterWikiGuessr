// ─── Domain errors ────────────────────────────────────────────────────────────

export class GameVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "GameVerificationError";
    }
}

export class HintLockedError extends Error {
    readonly minGuesses: number;
    constructor(minGuesses: number) {
        super(`Les indices images se débloquent après ${minGuesses} essais`);
        this.name = "HintLockedError";
        this.minGuesses = minGuesses;
    }
}

export class HintNotFoundError extends Error {
    constructor(hintIndex: number) {
        super(`Aucune image disponible pour l'index ${hintIndex}`);
        this.name = "HintNotFoundError";
    }
}
