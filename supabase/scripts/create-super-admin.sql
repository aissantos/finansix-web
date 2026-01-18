-- ============================================================================
-- CREATE SUPER ADMIN USER - Execute in Supabase Studio SQL Editor
-- ============================================================================
-- User: Versix Solutions
-- Email: versixsolutions@gmail.com  
-- Password: @Versix$$2025#
-- Role: super_admin
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Open your Supabase project dashboard
-- 2. Go to SQL Editor
-- 3. Paste this entire script
-- 4. Click "Run" or press Ctrl+Enter
-- ============================================================================

-- Create the super admin user
DO $$
DECLARE
  new_user_id UUID;
  user_password TEXT := '@Versix' || CHR(36) || CHR(36) || '2025#';
BEGIN
  -- First, check if user already exists
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'versixsolutions@gmail.com';

  IF new_user_id IS NOT NULL THEN
    RAISE NOTICE 'User already exists with ID: %', new_user_id;
    RAISE EXCEPTION 'User versixsolutions@gmail.com already exists. Aborting.';
  END IF;

  -- Create user using Supabase's internal function (if available)
  -- Note: This approach creates the user with proper Supabase auth setup
  
  -- Alternative: Insert directly (requires proper password hashing)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'versixsolutions@gmail.com',
    crypt(user_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Versix Solutions"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  )
  RETURNING id INTO new_user_id;

  -- Insert into admin_users
  INSERT INTO admin_users (
    id,
    email,
    name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'versixsolutions@gmail.com',
    'Versix Solutions',
    'super_admin',
    true,
    NOW(),
    NOW()
  );

  -- Create audit log
  INSERT INTO audit_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    result,
    metadata,
    timestamp
  ) VALUES (
    new_user_id,
    'admin_user_created',
    'admin_users',
    new_user_id::TEXT,
    'success',
    jsonb_build_object(
      'email', 'versixsolutions@gmail.com',
      'name', 'Versix Solutions',
      'role', 'super_admin',
      'created_by', 'system'
    ),
    NOW()
  );

  -- Success message
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUPER ADMIN CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', new_user_id;
  RAISE NOTICE 'Email: versixsolutions@gmail.com';
  RAISE NOTICE 'Password: @Versix%2025#', CHR(36) || CHR(36);
  RAISE NOTICE 'Role: super_admin';
  RAISE NOTICE '';
  RAISE NOTICE 'Login at: http://localhost:3000/admin/auth/login';
  RAISE NOTICE 'After login, you will setup 2FA (TOTP)';
  RAISE NOTICE '========================================';

END $$;
