import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const AMBIGUOUS_SSL_MODES = /\bsslmode=(prefer|require|verify-ca)\b/i;

function buildConnectionString(): string {
    const raw = process.env.DATABASE_URL ?? "";
    // Explicitly set verify-full to silence the pg deprecation warning
    if (AMBIGUOUS_SSL_MODES.test(raw)) {
        return raw.replace(AMBIGUOUS_SSL_MODES, "sslmode=verify-full");
    }
    return raw;
}

function createPrismaClient(): PrismaClient {
    const adapter = new PrismaPg({
        connectionString: buildConnectionString(),
    });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
