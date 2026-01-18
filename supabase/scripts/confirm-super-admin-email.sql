-- ============================================================================
-- CONFIRM SUPER ADMIN EMAIL
-- ============================================================================
-- This script confirms the email for versixsolutions@gmail.com
-- Execute in Supabase Studio SQL Editor
-- ============================================================================

UPDATE auth.users
SET 
  email_confirmed_at = NOW()
WHERE email = 'versixsolutions@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'versixsolutions@gmail.com';
