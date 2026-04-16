-- Setup triggers to sync Supabase auth.users → public.User
-- Run this AFTER GoTrue has created the auth schema (i.e. after docker compose up)
--
-- Usage:
--   docker exec supabase-db psql -U postgres -d postgres -f /dev/stdin < scripts/setup-auth-triggers.sql

-- Function: sync new Supabase auth users to public.User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public."User" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
    VALUES (
        NEW.id::text,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.email, ''),
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        "emailVerified" = EXCLUDED."emailVerified",
        image = EXCLUDED.image,
        "updatedAt" = EXCLUDED."updatedAt";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: fire on every auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: sync updated Supabase auth users to public.User
CREATE OR REPLACE FUNCTION public.handle_updated_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public."User"
    SET
        name = COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        email = COALESCE(NEW.email, ''),
        "emailVerified" = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        image = NEW.raw_user_meta_data->>'avatar_url',
        "updatedAt" = NEW.updated_at
    WHERE id = NEW.id::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: fire on every auth.users update
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_user();
