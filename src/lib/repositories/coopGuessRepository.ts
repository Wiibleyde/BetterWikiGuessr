import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export async function deleteOldCoopGuess(
    date: Date,
): Promise<Prisma.BatchPayload> {
    return prisma.coopGuess.deleteMany({
        where: { createdAt: { lt: date } },
    });
}
