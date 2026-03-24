import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import env from "@/env";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    socialProviders: {
        discord: {
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
        },
    },
});
