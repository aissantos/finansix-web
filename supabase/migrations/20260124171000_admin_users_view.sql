-- ============================================================================
-- Migration: User Profiles Table
-- Date: 2026-01-24
-- Purpose: Create user_profiles table that syncs with auth.users
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE: user_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_email ON user_profiles(email);

COMMENT ON TABLE user_profiles IS 
'User profile information synced from auth.users. Accessible to admins via RLS.';

-- ============================================================================
-- 2. ENABLE RLS
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Admins can view all user profiles
CREATE POLICY "Admins can view all user_profiles"
ON user_profiles FOR SELECT
USING (is_admin());

COMMENT ON POLICY "Admins can view all user_profiles" ON user_profiles IS
'Allows only active admins to view user profiles';

-- ============================================================================
-- 4. TRIGGER TO SYNC WITH AUTH.USERS
-- ============================================================================

-- Function to sync user profile when auth.users changes
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, display_name, created_at, updated_at)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users INSERT/UPDATE
CREATE TRIGGER on_auth_user_profile_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile();

COMMENT ON FUNCTION sync_user_profile IS 
'Automatically syncs user profile data from auth.users to user_profiles table';

-- ============================================================================
-- 5. POPULATE EXISTING USERS
-- ============================================================================

-- Sync existing users from auth.users to user_profiles
INSERT INTO user_profiles (id, email, display_name, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  created_at,
  NOW()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON user_profiles TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================



