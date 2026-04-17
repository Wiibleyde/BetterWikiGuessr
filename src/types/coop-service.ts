import type { GuessResult, MaskedArticle } from "@/types/game";
import type {
    CoopLobbyWithPlayers,
    CoopLobbyWithState,
} from "@/types/repository";

export type LobbyState = CoopLobbyWithState;
export type LobbyPlayer = CoopLobbyWithState["players"][number];

export interface CreateCoopLobbyResult {
    lobby: CoopLobbyWithPlayers;
    player: CoopLobbyWithPlayers["players"][number];
    playerToken: string;
}

export interface JoinCoopLobbyResult {
    lobby: LobbyState;
    player: LobbyPlayer;
    playerToken: string;
}

export interface LeaveLobbyResult {
    deleted: boolean;
}

export interface SubmitCoopGuessResult {
    guessResult: GuessResult;
    won: boolean;
}

export interface CoopLobbyStateResult {
    lobby: {
        code: string;
        status: string;
        maxPlayers: number;
        createdAt: string;
    };
    players: Array<{
        id: number;
        displayName: string;
        isLeader: boolean;
        guessCount: number;
    }>;
    guesses: Array<{
        id: number;
        word: string;
        found: boolean;
        occurrences: number;
        similarity: number;
        positions: unknown;
        player: {
            id: number;
            displayName: string;
        };
        createdAt: string;
    }>;
    article: MaskedArticle | null;
}
