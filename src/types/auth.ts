export interface AuthUser {
    id: number;
    discordId: string;
    username: string;
    avatar: string | null;
}

export interface GameResultData {
    id: number;
    guessCount: number;
    won: boolean;
    createdAt: string;
    date: string;
    articleTitle: string;
}

export interface ProfileStats {
    totalGames: number;
    totalWins: number;
    winRate: number;
    averageGuesses: number;
    results: GameResultData[];
}
