import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export async function deleteOldPlayers(
    date: Date,
): Promise<Prisma.BatchPayload> {
    return prisma.coopPlayer.deleteMany({
        where: { joinedAt: { lt: date } },
    });
}
