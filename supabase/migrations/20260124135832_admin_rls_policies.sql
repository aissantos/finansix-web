-- ============================================================================
-- Migration: Admin RLS Policies
-- Date: 2026-01-24
-- Purpose: Enable RLS and create policies for admin tables
-- Security: Remove need for service role key in client-side code
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ADMIN TABLES
-- ============================================================================

-- Enable RLS on admin_users (currently disabled - security risk!)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on audit_logs if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on system_settings if exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- 2. HELPER FUNCTION: Check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin() IS 
'Returns true if the current user is an active admin. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- 3. HELPER FUNCTION: Check if user is super admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_super_admin() IS 
'Returns true if the current user is an active super admin. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================================
-- 4. RLS POLICIES FOR admin_users
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view all admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view their own record" ON admin_users;

-- Policy: Admins can view all admin_users
CREATE POLICY "Admins can view all admin_users"
ON admin_users FOR SELECT
USING (is_admin());

-- Policy: Admins can view their own record (for profile updates)
CREATE POLICY "Admins can update their own record"
ON admin_users FOR UPDATE
USING (id = auth.uid() AND is_admin())
WITH CHECK (id = auth.uid() AND is_admin());

-- Policy: Super admins can insert new admins
CREATE POLICY "Super admins can insert admin_users"
ON admin_users FOR INSERT
WITH CHECK (is_super_admin());

-- Policy: Super admins can update any admin
CREATE POLICY "Super admins can update admin_users"
ON admin_users FOR UPDATE
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- Policy: Super admins can delete admins
CREATE POLICY "Super admins can delete admin_users"
ON admin_users FOR DELETE
USING (is_super_admin());

-- ============================================================================
-- 5. RLS POLICIES FOR audit_logs
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Admins can view audit_logs" ON audit_logs;
    DROP POLICY IF EXISTS "System can insert audit_logs" ON audit_logs;
    
    -- Policy: Admins can view all audit logs
    EXECUTE 'CREATE POLICY "Admins can view audit_logs"
    ON audit_logs FOR SELECT
    USING (is_admin())';
    
    -- Policy: System can insert audit logs (for triggers)
    EXECUTE 'CREATE POLICY "System can insert audit_logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true)';
    
    -- Note: No UPDATE or DELETE policies - audit logs should be immutable
  END IF;
END $$;

-- ============================================================================
-- 6. RLS POLICIES FOR system_settings
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Admins can view system_settings" ON system_settings;
    DROP POLICY IF EXISTS "Super admins can manage system_settings" ON system_settings;
    
    -- Policy: Admins can view system settings
    EXECUTE 'CREATE POLICY "Admins can view system_settings"
    ON system_settings FOR SELECT
    USING (is_admin())';
    
    -- Policy: Super admins can manage system settings
    EXECUTE 'CREATE POLICY "Super admins can manage system_settings"
    ON system_settings FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin())';
  END IF;
END $$;

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('admin_users', 'audit_logs', 'system_settings');

-- Verify policies exist
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('admin_users', 'audit_logs', 'system_settings')
-- ORDER BY tablename, policyname;

-- Test as admin (replace with your admin user_id)
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims.sub TO 'your-admin-user-id';
-- SELECT * FROM admin_users;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE admin_users IS 
'Admin users table with RLS enabled. Only active admins can view, super admins can manage.';
