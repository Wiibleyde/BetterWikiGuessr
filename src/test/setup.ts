// Provide fallback env vars so that env.ts (Zod parse) succeeds during tests.
// Real values are never needed because tests mock DB/auth modules.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.DISCORD_CLIENT_ID ??= "test-discord-client-id";
process.env.DISCORD_CLIENT_SECRET ??= "test-discord-client-secret";
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost:8000";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-supabase-anon-key";
process.env.GAME_TIMEZONE ??= "Europe/Paris";
