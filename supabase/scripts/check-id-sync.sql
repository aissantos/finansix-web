-- ============================================================================
-- CHECK ID SYNC BETWEEN auth.users AND admin_users
-- ============================================================================

SELECT 
  'auth.users' as source,
  id,
  email
FROM auth.users
WHERE email = 'versixsolutions@gmail.com'

UNION ALL

SELECT 
  'admin_users' as source,
  id,
  email
FROM admin_users
WHERE email = 'versixsolutions@gmail.com';
