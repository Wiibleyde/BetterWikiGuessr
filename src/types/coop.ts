import type { MaskedArticle, ProximityReason, WordPosition } from "./game";

export interface CoopLobbyInfo {
    code: string;
    status: "waiting" | "playing" | "finished";
    maxPlayers: number;
    createdAt: string;
}

export interface CoopPlayerInfo {
    id: number;
    displayName: string;
    isLeader: boolean;
    guessCount: number;
}

export interface CoopGuessEntry {
    id: number;
    word: string;
    found: boolean;
    occurrences: number;
    similarity: number;
    positions: WordPosition[];
    proximityReason?: ProximityReason;
    player: {
        id: number;
        displayName: string;
    };
    createdAt: string;
}

export interface CoopLobbyState {
    lobby: CoopLobbyInfo;
    players: CoopPlayerInfo[];
    guesses: CoopGuessEntry[];
    article: MaskedArticle | null;
}

export interface CoopJoinResponse {
    code: string;
    playerId: number;
    playerToken: string;
    isLeader: boolean;
}

export type CoopBroadcastEvent =
    | {
          type: "player_joined";
          payload: { playerId: number; displayName: string };
      }
    | {
          type: "player_left";
          payload: { playerId: number; displayName: string };
      }
    | {
          type: "leader_changed";
          payload: { newLeaderId: number; displayName: string };
      }
    | {
          type: "game_started";
          payload: { article: MaskedArticle };
      }
    | {
          type: "guess_result";
          payload: { guess: CoopGuessEntry };
      }
    | {
          type: "game_won";
          payload: {
              totalGuesses: number;
              playerCount: number;
              positions: WordPosition[];
          };
      };
