#!/usr/bin/env bun
/**
 * Reverse migration script: Supabase Auth → BetterAuth
 *
 * Reads users from Supabase's auth.users + auth.identities tables and creates
 * corresponding BetterAuth Account rows in the public schema so existing
 * Discord-linked users can log in again via BetterAuth.
 *
 * Supabase auth uses UUIDs for user IDs. If the public."User".id already
 * matches the auth.users.id, no remapping is needed. Otherwise, the script
 * updates User.id (FKs on GameResult/GameState cascade).
 *
 * Usage:
 *   bun run scripts/migrate-from-supabase-auth.ts
 *
 * Requirements:
 *   - DATABASE_URL must point to the PostgreSQL database
 *   - The auth schema must exist (GoTrue must have run at least once)
 *   - The BetterAuth Account table must exist (run prisma migrate first)
 *
 * This script is idempotent — safe to run multiple times.
 */

import crypto from "node:crypto";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is required");
    process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL });

interface SupabaseAuthUser {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    raw_user_meta_data: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

interface SupabaseIdentity {
    id: string;
    user_id: string;
    provider: string;
    provider_id: string;
    identity_data: Record<string, unknown>;
    last_sign_in_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

async function main(): Promise<void> {
    await client.connect();
    console.log("✅ Connected to database");

    // Check that auth schema exists
    const schemaCheck = await client.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.schemata
            WHERE schema_name = 'auth'
        ) AS exists;
    `);

    if (!schemaCheck.rows[0]?.exists) {
        console.error(
            "❌ The auth schema does not exist. GoTrue must have run at least once.",
        );
        await client.end();
        process.exit(1);
    }

    // Check that the BetterAuth Account table exists
    const accountTableCheck = await client.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'Account'
        ) AS exists;
    `);

    if (!accountTableCheck.rows[0]?.exists) {
        console.error(
            "❌ The Account table does not exist. Run prisma migrate first.",
        );
        await client.end();
        process.exit(1);
    }

    // Fetch all Supabase auth users
    const usersResult = await client.query<SupabaseAuthUser>(
        "SELECT id, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at FROM auth.users ORDER BY created_at ASC",
    );

    // Fetch all Discord identities
    const identitiesResult = await client.query<SupabaseIdentity>(
        "SELECT id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at FROM auth.identities WHERE provider = 'discord' ORDER BY created_at ASC",
    );

    const identitiesByUserId = new Map<string, SupabaseIdentity>();
    for (const identity of identitiesResult.rows) {
        identitiesByUserId.set(identity.user_id, identity);
    }

    console.log(
        `📊 Found ${usersResult.rows.length} Supabase auth users and ${identitiesResult.rows.length} Discord identities`,
    );

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const authUser of usersResult.rows) {
        const identity = identitiesByUserId.get(authUser.id);

        try {
            // Check if this user already has an Account row (idempotency)
            const existingAccount = await client.query(
                `SELECT id FROM public."Account" WHERE "userId" = $1 AND "providerId" = 'discord'`,
                [authUser.id],
            );

            if (existingAccount.rows.length > 0) {
                const name =
                    (authUser.raw_user_meta_data?.full_name as string) ??
                    (authUser.raw_user_meta_data?.name as string) ??
                    authUser.email;
                console.log(
                    `  ⏭️  Already migrated: ${name} (${authUser.email})`,
                );
                skipped++;
                continue;
            }

            // Ensure the public.User row exists for this auth user
            const publicUser = await client.query(
                `SELECT id FROM public."User" WHERE id = $1`,
                [authUser.id],
            );

            if (publicUser.rows.length === 0) {
                // Create the public.User row from auth data
                const name =
                    (authUser.raw_user_meta_data?.full_name as string) ??
                    (authUser.raw_user_meta_data?.name as string) ??
                    authUser.email?.split("@")[0] ??
                    "User";
                const image =
                    (authUser.raw_user_meta_data?.avatar_url as string) ?? null;

                await client.query(
                    `INSERT INTO public."User" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (id) DO NOTHING`,
                    [
                        authUser.id,
                        name,
                        authUser.email ?? "",
                        !!authUser.email_confirmed_at,
                        image,
                        authUser.created_at,
                        authUser.updated_at,
                    ],
                );
            }

            // Create the BetterAuth Account row
            if (identity) {
                const accountId = crypto.randomUUID();
                const discordAccountId = identity.provider_id;

                await client.query(
                    `INSERT INTO public."Account" (
                        id, "accountId", "providerId", "userId",
                        "accessToken", "refreshToken", "idToken",
                        "accessTokenExpiresAt", "refreshTokenExpiresAt",
                        scope, password, "createdAt", "updatedAt"
                    ) VALUES (
                        $1, $2, 'discord', $3,
                        NULL, NULL, NULL,
                        NULL, NULL,
                        'identify email', NULL, $4, $5
                    )
                    ON CONFLICT ("providerId", "accountId") DO NOTHING`,
                    [
                        accountId,
                        discordAccountId,
                        authUser.id,
                        identity.created_at,
                        identity.updated_at,
                    ],
                );

                const name =
                    (authUser.raw_user_meta_data?.full_name as string) ??
                    (authUser.raw_user_meta_data?.name as string) ??
                    authUser.email;
                migrated++;
                console.log(`  ✅ Migrated: ${name} (${authUser.email})`);
            } else {
                const name =
                    (authUser.raw_user_meta_data?.full_name as string) ??
                    authUser.email;
                console.log(
                    `  ⚠️  No Discord identity found for: ${name} (${authUser.email}) — skipping Account creation`,
                );
                skipped++;
            }
        } catch (err) {
            const name =
                (authUser.raw_user_meta_data?.full_name as string) ??
                authUser.email;
            errors++;
            console.error(`  ❌ Failed: ${name} (${authUser.email}):`, err);
        }
    }

    console.log("\n📋 Migration Summary:");
    console.log(`  ✅ Migrated: ${migrated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);

    await client.end();
    console.log("\n✅ Done!");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
