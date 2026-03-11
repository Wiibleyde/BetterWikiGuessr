import type { DiscordUser } from "@/app/api/auth/callback/route";
import type { User } from "../../../generated/prisma/client";
import { prisma } from "../prisma";

export const createUser = async (discordUser: DiscordUser): Promise<User> => {
    const user = await prisma.user.upsert({
        where: { discordId: discordUser.id },
        update: {
            username: discordUser.username,
            avatar: discordUser.avatar,
        },
        create: {
            discordId: discordUser.id,
            username: discordUser.username,
            avatar: discordUser.avatar,
        },
    });
    return user;
};

export const getUserById = async (id: number): Promise<User | null> => {
    return prisma.user.findUnique({
        where: { id },
    });
}

export const getUserWhereIdIn = async (ids: number[]): Promise<User[]> => {
    return prisma.user.findMany({
        where: { id: { in: ids } },
    });
}