import z from "zod";

const envSchema = z.object({
    DATABASE_URL: z.url(),
    DISCORD_CLIENT_ID: z.string(),
    DISCORD_CLIENT_SECRET: z.string(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GAME_TIMEZONE: z.string().default("Europe/Paris"),
});

const env = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GAME_TIMEZONE: process.env.GAME_TIMEZONE,
});

export default env;
