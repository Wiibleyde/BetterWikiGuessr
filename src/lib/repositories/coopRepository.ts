import type {
    CoopGuessWithPlayer,
    CoopLobbyWithPlayers,
    CoopLobbyWithState,
    CoopPlayerWithLobby,
} from "@/types/repository";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export async function createLobby(
    code: string,
    leaderName: string,
    leaderToken: string,
    leaderId?: string,
): Promise<CoopLobbyWithPlayers> {
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

export async function getLobbyByCode(
    code: string,
): Promise<CoopLobbyWithState | null> {
    return prisma.coopLobby.findUnique({
        where: { code },
        include: {
            players: { orderBy: { joinedAt: "asc" } },
            guesses: {
                orderBy: { createdAt: "desc" },
                include: {
                    player: { select: { id: true, displayName: true } },
                },
            },
        },
    });
}

export async function updateLobbyStatus(
    code: string,
    status: string,
): Promise<Prisma.CoopLobbyGetPayload<object>> {
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
): Promise<Prisma.CoopLobbyGetPayload<object>> {
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
): Promise<Prisma.CoopPlayerGetPayload<object>> {
    return prisma.coopPlayer.create({
        data: { lobbyId, displayName, token, userId },
    });
}

export async function getPlayerByToken(
    token: string,
): Promise<CoopPlayerWithLobby | null> {
    return prisma.coopPlayer.findUnique({
        where: { token },
        include: { lobby: true },
    });
}

export async function getPlayerByUserAndLobby(
    userId: string,
    lobbyId: number,
): Promise<Prisma.CoopPlayerGetPayload<object> | null> {
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
): Promise<CoopGuessWithPlayer> {
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

export async function getAllGuessedWords(lobbyId: number): Promise<string[]> {
    const guesses = await prisma.coopGuess.findMany({
        where: { lobbyId },
        select: { word: true },
        distinct: ["word"],
    });
    return guesses.map((g) => g.word);
}

export async function removePlayer(
    playerId: number,
): Promise<Prisma.CoopPlayerGetPayload<object>> {
    return prisma.coopPlayer.delete({ where: { id: playerId } });
}

export async function transferLeadership(
    _lobbyId: number,
    oldLeaderId: number,
    newLeaderId: number,
): Promise<
    [Prisma.CoopPlayerGetPayload<object>, Prisma.CoopPlayerGetPayload<object>]
> {
    return prisma.$transaction([
        prisma.coopPlayer.update({
            where: { id: oldLeaderId },
            data: { isLeader: false },
        }),
        prisma.coopPlayer.update({
            where: { id: newLeaderId },
            data: { isLeader: true },
        }),
    ]);
}

export async function deleteLobby(
    code: string,
): Promise<Prisma.CoopLobbyGetPayload<object>> {
    return prisma.coopLobby.delete({ where: { code } });
}

export async function deleteOldLobbies(
    date: Date,
): Promise<Prisma.BatchPayload> {
    return prisma.coopLobby.deleteMany({
        where: { createdAt: { lt: date } },
    });
}
