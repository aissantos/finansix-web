-- ============================================================================
-- Migration: Fix Sync User Profile Trigger
-- Date: 2026-01-24
-- Purpose: Make sync_user_profile mechanism more robust to prevent login 500 errors
-- ============================================================================

-- Drop trigger first to ensure clean state
DROP TRIGGER IF EXISTS on_auth_user_profile_sync ON auth.users;

-- Recreate the function with better safety and explicit schema handling
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Validate Email (auth.users can have null email for phone auth)
  -- If email is null, we can't insert into user_profiles if it requires email NOT NULL
  -- So we handle it or skip
  IF NEW.email IS NULL THEN
    RETURN NEW; -- Skip sync for users without email (or handle differently if needed)
  END IF;

  -- Use explicit schema public.user_profiles
  INSERT INTO public.user_profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- CRITICAL: Catch all errors to prevent blocking authentication
    -- We log the error but allow the auth transaction to proceed
    RAISE WARNING 'Error syncing user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_profile_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_profile();

-- Comment
COMMENT ON FUNCTION public.sync_user_profile IS 
'Syncs auth.users to user_profiles. Includes exception handling to never block login.';
