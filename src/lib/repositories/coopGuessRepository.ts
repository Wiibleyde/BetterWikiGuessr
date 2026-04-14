import { prisma } from "../prisma";

export async function deleteOldCoopGuess(date: Date) {
    return prisma.coopGuess.deleteMany({
        where: { createdAt: { lt: date } },
    });
}
