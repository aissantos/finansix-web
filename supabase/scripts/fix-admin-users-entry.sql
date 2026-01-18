-- ============================================================================
-- VERIFY AND FIX ADMIN_USERS ENTRY
-- ============================================================================
-- This script checks if the user exists in admin_users and adds if missing
-- Execute in Supabase Studio SQL Editor
-- ============================================================================

-- Step 1: Check current state
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at
FROM auth.users
WHERE email = 'versixsolutions@gmail.com'

UNION ALL

SELECT 
  'admin_users' as table_name,
  id,
  email,
  created_at
FROM admin_users
WHERE email = 'versixsolutions@gmail.com';

-- Step 2: Insert into admin_users if missing
INSERT INTO admin_users (
  id,
  email,
  name,
  role,
  is_active,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'versixsolutions@gmail.com',
  'Versix Solutions',
  'super_admin',
  true,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email = 'versixsolutions@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM admin_users a WHERE a.id = u.id
  );

-- Step 3: Verify the insert
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM admin_users
WHERE email = 'versixsolutions@gmail.com';
