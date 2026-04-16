import type { SocialProvider } from "@/hooks/useAuth";
import type { User } from "../../generated/prisma/client";

export type AuthUser = User;

export interface GameResultData {
    id: number;
    guessCount: number;
    hintsUsed: number;
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
    averageHints: number;
    results: GameResultData[];
}

export interface LoginProvider {
    name: SocialProvider;
    label: string;
    icon: React.ReactNode;
    className?: string;
}
