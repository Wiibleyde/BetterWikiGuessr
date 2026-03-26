import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export async function createLobby(
    code: string,
    leaderName: string,
    leaderToken: string,
    leaderId?: string,
) {
    return prisma.coopLobby.create({
        data: {
            code,
            players: {
                create: {
                    displayName: leaderName,
                    token: leaderToken,
                    isLeader: true,
                    userId: leaderId,
                },
            },
        },
        include: { players: true },
    });
}

export async function getLobbyByCode(code: string) {
    return prisma.coopLobby.findUnique({
        where: { code },
        include: {
            players: { orderBy: { joinedAt: "asc" } },
            guesses: {
                orderBy: { createdAt: "asc" },
                include: {
                    player: { select: { id: true, displayName: true } },
                },
            },
        },
    });
}

export async function updateLobbyStatus(code: string, status: string) {
    return prisma.coopLobby.update({
        where: { code },
        data: { status },
    });
}

export async function setLobbyWikiPage(
    code: string,
    wikiTitle: string,
    wikiSections: Prisma.InputJsonValue,
    wikiImages: string[],
    wikiUrl: string,
) {
    return prisma.coopLobby.update({
        where: { code },
        data: {
            wikiTitle,
            wikiSections,
            wikiImages,
            wikiUrl,
            status: "playing",
        },
    });
}

export async function addPlayer(
    lobbyId: number,
    displayName: string,
    token: string,
    userId?: string,
) {
    return prisma.coopPlayer.create({
        data: { lobbyId, displayName, token, userId },
    });
}

export async function getPlayerByToken(token: string) {
    return prisma.coopPlayer.findUnique({
        where: { token },
        include: { lobby: true },
    });
}

export async function getPlayerByUserAndLobby(userId: string, lobbyId: number) {
    return prisma.coopPlayer.findFirst({
        where: { userId, lobbyId },
    });
}

export async function getPlayerCount(lobbyId: number): Promise<number> {
    return prisma.coopPlayer.count({ where: { lobbyId } });
}

export async function addGuess(
    lobbyId: number,
    playerId: number,
    word: string,
    found: boolean,
    occurrences: number,
    similarity: number,
    positions: Prisma.InputJsonValue,
) {
    return prisma.coopGuess.create({
        data: {
            lobbyId,
            playerId,
            word,
            found,
            occurrences,
            similarity,
            positions,
        },
        include: { player: { select: { id: true, displayName: true } } },
    });
}

export async function getFoundGuessWords(lobbyId: number): Promise<string[]> {
    const guesses = await prisma.coopGuess.findMany({
        where: { lobbyId, found: true },
        select: { word: true },
        distinct: ["word"],
    });
    return guesses.map((g) => g.word);
}
