#!/usr/bin/env bun
/**
 * Migration script: Better Auth → Supabase Auth
 *
 * Reads existing User + Account rows from the public schema and inserts them
 * into Supabase's auth.users + auth.identities tables so existing Discord-linked
 * users can log in again without losing their game history.
 *
 * Better Auth IDs are opaque strings (not UUIDs). This script generates a new
 * UUID for each user in auth.users, then updates public."User".id and all
 * foreign keys that reference it so game history is preserved.
 *
 * Usage:
 *   bun run scripts/migrate-to-supabase-auth.ts
 *
 * Requirements:
 *   - DATABASE_URL must point to the Supabase PostgreSQL database
 *   - The auth schema must exist (GoTrue must have run at least once)
 *   - Run BEFORE dropping the Account/Session tables (or from a backup)
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

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
    return UUID_RE.test(value);
}

interface BetterAuthUser {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface BetterAuthAccount {
    id: string;
    accountId: string;
    providerId: string;
    userId: string;
    accessToken: string | null;
    refreshToken: string | null;
    scope: string | null;
    createdAt: Date;
    updatedAt: Date;
}

async function main(): Promise<void> {
    await client.connect();
    console.log("✅ Connected to database");

    // Check if the old Account table still exists
    const tableCheck = await client.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'Account'
        ) AS exists;
    `);

    if (!tableCheck.rows[0]?.exists) {
        console.log(
            "⚠️  The Account table no longer exists. If you already dropped it,",
        );
        console.log(
            "   make sure users have been migrated or will re-register via Discord.",
        );
        await client.end();
        return;
    }

    // Fetch all users with their Discord accounts
    const usersResult = await client.query<BetterAuthUser>(
        'SELECT * FROM public."User" ORDER BY "createdAt" ASC',
    );
    const accountsResult = await client.query<BetterAuthAccount>(
        `SELECT * FROM public."Account" WHERE "providerId" = 'discord' ORDER BY "createdAt" ASC`,
    );

    const accountsByUserId = new Map<string, BetterAuthAccount>();
    for (const account of accountsResult.rows) {
        accountsByUserId.set(account.userId, account);
    }

    console.log(
        `📊 Found ${usersResult.rows.length} users and ${accountsResult.rows.length} Discord accounts`,
    );

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of usersResult.rows) {
        const account = accountsByUserId.get(user.id);

        try {
            // Determine the UUID for auth.users
            const newUuid = isUuid(user.id) ? user.id : crypto.randomUUID();

            // Check if this user was already migrated (by email to handle re-runs)
            const existing = await client.query(
                "SELECT id FROM auth.users WHERE email = $1",
                [user.email],
            );

            if (existing.rows.length > 0) {
                console.log(
                    `  ⏭️  Already exists: ${user.name} (${user.email})`,
                );
                skipped++;
                continue;
            }

            // Build user metadata from Discord account
            const userMetadata: Record<string, unknown> = {
                name: user.name,
                full_name: user.name,
            };
            if (user.image) {
                userMetadata.avatar_url = user.image;
            }
            if (account) {
                userMetadata.provider_id = account.accountId;
                userMetadata.sub = account.accountId;
            }

            await client.query("BEGIN");

            // Step 1: If ID needs remapping, just update User.id directly.
            // The FK constraints on GameResult and GameState are ON UPDATE CASCADE
            // so they'll be updated automatically by PostgreSQL.
            if (newUuid !== user.id) {
                console.log(`  🔄 Remapping ID: ${user.id} → ${newUuid}`);

                await client.query(
                    `UPDATE public."User" SET id = $1 WHERE id = $2`,
                    [newUuid, user.id],
                );
            }

            // Step 2: Insert into auth.users (trigger will ON CONFLICT UPDATE the
            // public.User row we just remapped)
            await client.query(
                `INSERT INTO auth.users (
                    id, instance_id, aud, role, email, encrypted_password,
                    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                    created_at, updated_at, confirmation_token, is_super_admin,
                    recovery_token, email_change, email_change_token_new,
                    email_change_token_current, phone_change_token, reauthentication_token
                ) VALUES (
                    $1::uuid,
                    '00000000-0000-0000-0000-000000000000',
                    'authenticated',
                    'authenticated',
                    $2,
                    '',
                    $3,
                    $4::jsonb,
                    $5::jsonb,
                    $6,
                    $7,
                    '',
                    false,
                    '', '', '', '', '', ''
                )
                ON CONFLICT (id) DO NOTHING`,
                [
                    newUuid,
                    user.email || `${user.id}@noemail.local`,
                    user.emailVerified ? user.createdAt.toISOString() : null,
                    JSON.stringify(
                        account
                            ? {
                                  provider: "discord",
                                  providers: ["discord"],
                              }
                            : { provider: "email", providers: ["email"] },
                    ),
                    JSON.stringify(userMetadata),
                    user.createdAt,
                    user.updatedAt,
                ],
            );

            // Step 3: Insert Discord identity if account exists
            if (account) {
                const identityData: Record<string, unknown> = {
                    sub: account.accountId,
                    name: user.name,
                    full_name: user.name,
                    provider_id: account.accountId,
                };
                if (user.image) {
                    identityData.avatar_url = user.image;
                }
                if (user.email) {
                    identityData.email = user.email;
                }

                await client.query(
                    `INSERT INTO auth.identities (
                        id, user_id, identity_data, provider, provider_id,
                        last_sign_in_at, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(),
                        $1::uuid,
                        $2::jsonb,
                        'discord',
                        $3,
                        $4,
                        $5,
                        $6
                    )
                    ON CONFLICT (provider, provider_id) DO NOTHING`,
                    [
                        newUuid,
                        JSON.stringify(identityData),
                        account.accountId,
                        account.updatedAt,
                        account.createdAt,
                        account.updatedAt,
                    ],
                );
            }

            await client.query("COMMIT");

            migrated++;
            console.log(`  ✅ Migrated: ${user.name} (${user.email})`);
        } catch (err) {
            await client.query("ROLLBACK").catch(() => {});
            errors++;
            console.error(`  ❌ Failed: ${user.name} (${user.email}):`, err);
        }
    }

    console.log("\n📋 Migration Summary:");
    console.log(`  ✅ Migrated: ${migrated}`);
    console.log(`  ⏭️  Skipped (already exists): ${skipped}`);
    console.log(`  ❌ Errors: ${errors}`);

    await client.end();
    console.log("\n✅ Done!");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
