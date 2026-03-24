import type { User } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export const getUserWhereIdIn = async (ids: string[]): Promise<User[]> => {
    return prisma.user.findMany({ where: { id: { in: ids } } });
};
