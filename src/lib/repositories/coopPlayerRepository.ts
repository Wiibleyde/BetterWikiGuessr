import { prisma } from "../prisma";

export async function deleteOldPlayers(date: Date) {
    return prisma.coopPlayer.deleteMany({
        where: { joinedAt: { lt: date } },
    });
}
