-- ============================================================================
-- USER MANAGEMENT MIGRATION
-- ============================================================================
-- Sprint 3: User Management CRUD
-- Created: 2026-01-18
-- Purpose: Tables and functions for user management and impersonation
-- ============================================================================

-- ============================================================================
-- 1. IMPERSONATION SESSIONS TABLE
-- ============================================================================

-- Drop existing table if it exists (in case of partial migration)
DROP TABLE IF EXISTS impersonation_sessions CASCADE;

CREATE TABLE impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT active_session_check CHECK (ended_at IS NULL OR ended_at > started_at),
  CONSTRAINT timeout_check CHECK (timeout_at > started_at)
);

-- Indexes for performance
CREATE INDEX idx_impersonation_sessions_admin_id ON impersonation_sessions(admin_id);
CREATE INDEX idx_impersonation_sessions_user_id ON impersonation_sessions(user_id);
CREATE INDEX idx_impersonation_sessions_active ON impersonation_sessions(admin_id, user_id) 
  WHERE ended_at IS NULL;

-- Comments
COMMENT ON TABLE impersonation_sessions IS 'Tracks admin impersonation sessions for audit and security';
COMMENT ON COLUMN impersonation_sessions.timeout_at IS 'Automatic session timeout (default 30 minutes)';
COMMENT ON COLUMN impersonation_sessions.reason IS 'Admin-provided reason for impersonation';

-- ============================================================================
-- 2. RLS POLICIES FOR IMPERSONATION SESSIONS
-- ============================================================================

ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can view their own impersonation sessions
CREATE POLICY "Admins can view own impersonation sessions"
  ON impersonation_sessions FOR SELECT
  TO authenticated
  USING (
    admin_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Only super_admins can create impersonation sessions
CREATE POLICY "Only super_admins can create impersonation sessions"
  ON impersonation_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Admins can update their own sessions (to end them)
CREATE POLICY "Admins can update own impersonation sessions"
  ON impersonation_sessions FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid());

-- ============================================================================
-- 3. RPC FUNCTION: GET USER STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_statistics(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  total_trans INT;
  total_exp NUMERIC;
  total_inc NUMERIC;
  categories_count INT;
  last_transaction_date TIMESTAMPTZ;
  first_transaction_date TIMESTAMPTZ;
BEGIN
  -- Get transaction statistics
  SELECT
    COUNT(*),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    COUNT(DISTINCT category_id),
    MAX(transaction_date),
    MIN(transaction_date)
  INTO
    total_trans,
    total_exp,
    total_inc,
    categories_count,
    last_transaction_date,
    first_transaction_date
  FROM transactions
  WHERE created_by = user_id_param
    AND deleted_at IS NULL;
  
  -- Build JSON result
  result := json_build_object(
    'totalTransactions', COALESCE(total_trans, 0),
    'totalExpenses', COALESCE(total_exp, 0),
    'totalIncome', COALESCE(total_inc, 0),
    'netBalance', COALESCE(total_inc - total_exp, 0),
    'categoriesUsed', COALESCE(categories_count, 0),
    'lastTransactionDate', last_transaction_date,
    'firstTransactionDate', first_transaction_date,
    'averageTransactionAmount', CASE 
      WHEN total_trans > 0 THEN (total_exp + total_inc) / total_trans
      ELSE 0
    END
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return default values on error
    RETURN json_build_object(
      'totalTransactions', 0,
      'totalExpenses', 0,
      'totalIncome', 0,
      'netBalance', 0,
      'categoriesUsed', 0,
      'lastTransactionDate', NULL,
      'firstTransactionDate', NULL,
      'averageTransactionAmount', 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_statistics(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_statistics IS 'Returns comprehensive statistics for a specific user';

-- ============================================================================
-- 4. RPC FUNCTION: START IMPERSONATION
-- ============================================================================

CREATE OR REPLACE FUNCTION start_impersonation(
  target_user_id UUID,
  impersonation_reason TEXT DEFAULT NULL,
  client_ip INET DEFAULT NULL,
  client_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  admin_role TEXT;
BEGIN
  -- Check if caller is super_admin
  SELECT role INTO admin_role
  FROM admin_users
  WHERE id = auth.uid()
    AND is_active = true;
  
  IF admin_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super_admins can impersonate users';
  END IF;
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- End any existing active sessions for this admin
  UPDATE impersonation_sessions
  SET ended_at = NOW()
  WHERE admin_id = auth.uid()
    AND ended_at IS NULL;
  
  -- Create new impersonation session
  INSERT INTO impersonation_sessions (
    admin_id,
    user_id,
    reason,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    target_user_id,
    impersonation_reason,
    client_ip,
    client_user_agent
  )
  RETURNING id INTO session_id;
  
  -- Log to audit_logs
  INSERT INTO audit_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    result,
    metadata
  ) VALUES (
    auth.uid(),
    'impersonation_started',
    'users',
    target_user_id::TEXT,
    'success',
    jsonb_build_object(
      'session_id', session_id,
      'reason', impersonation_reason,
      'ip_address', client_ip::TEXT
    )
  );
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION start_impersonation(UUID, TEXT, INET, TEXT) TO authenticated;

COMMENT ON FUNCTION start_impersonation IS 'Starts an impersonation session (super_admin only)';

-- ============================================================================
-- 5. RPC FUNCTION: STOP IMPERSONATION
-- ============================================================================

CREATE OR REPLACE FUNCTION stop_impersonation(session_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Get session details
  SELECT * INTO session_record
  FROM impersonation_sessions
  WHERE id = session_id_param
    AND admin_id = auth.uid()
    AND ended_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active impersonation session not found';
  END IF;
  
  -- End the session
  UPDATE impersonation_sessions
  SET ended_at = NOW()
  WHERE id = session_id_param;
  
  -- Log to audit_logs
  INSERT INTO audit_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    result,
    metadata
  ) VALUES (
    auth.uid(),
    'impersonation_stopped',
    'users',
    session_record.user_id::TEXT,
    'success',
    jsonb_build_object(
      'session_id', session_id_param,
      'duration_seconds', EXTRACT(EPOCH FROM (NOW() - session_record.started_at))
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION stop_impersonation(UUID) TO authenticated;

COMMENT ON FUNCTION stop_impersonation IS 'Stops an active impersonation session';

-- ============================================================================
-- 6. FUNCTION: AUTO-EXPIRE IMPERSONATION SESSIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_impersonation_sessions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- End sessions that have exceeded timeout
  WITH expired AS (
    UPDATE impersonation_sessions
    SET ended_at = NOW()
    WHERE ended_at IS NULL
      AND timeout_at < NOW()
    RETURNING id, admin_id, user_id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;
  
  -- Log expired sessions
  INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, result, metadata)
  SELECT 
    admin_id,
    'impersonation_expired',
    'users',
    user_id::TEXT,
    'success',
    jsonb_build_object('session_id', id, 'reason', 'timeout')
  FROM (
    SELECT * FROM impersonation_sessions
    WHERE ended_at = NOW()
      AND timeout_at < NOW()
  ) expired_sessions;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION expire_impersonation_sessions() TO authenticated;

COMMENT ON FUNCTION expire_impersonation_sessions IS 'Automatically expires timed-out impersonation sessions';
