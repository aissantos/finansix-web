-- ============================================================================
-- FIX RLS POLICIES FOR admin_users TABLE
-- ============================================================================
-- This allows authenticated users to read their own admin record during login
-- Execute in Supabase Studio SQL Editor
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow users to read own admin record" ON admin_users;
DROP POLICY IF EXISTS "Allow service role full access" ON admin_users;

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to read their own admin record
-- This is needed for the login flow to check if user is an admin
CREATE POLICY "Allow users to read own admin record"
ON admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Allow service role full access (for admin operations)
CREATE POLICY "Allow service role full access"
ON admin_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'admin_users';
