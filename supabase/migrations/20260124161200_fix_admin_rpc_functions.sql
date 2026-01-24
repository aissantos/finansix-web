-- ============================================================================
-- Migration: Fix Admin Dashboard RPC Functions
-- Date: 2026-01-24
-- Purpose: Add admin verification to dashboard RPC functions
-- ============================================================================

-- Update get_dashboard_metrics to verify admin access
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify user is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  WITH metrics AS (
    SELECT
      -- Active Users (last 24h) - users who created transactions
      (SELECT COUNT(DISTINCT created_by) 
       FROM transactions 
       WHERE created_at > NOW() - INTERVAL '24 hours'
         AND created_by IS NOT NULL
         AND deleted_at IS NULL) AS active_users,
      
      -- Active Users Yesterday
      (SELECT COUNT(DISTINCT created_by) 
       FROM transactions 
       WHERE created_at BETWEEN NOW() - INTERVAL '48 hours' 
         AND NOW() - INTERVAL '24 hours'
         AND created_by IS NOT NULL
         AND deleted_at IS NULL) AS active_users_yesterday,
      
      -- Transactions Today
      (SELECT COUNT(*) 
       FROM transactions 
       WHERE DATE(created_at) = CURRENT_DATE 
         AND deleted_at IS NULL) AS transactions_today,
      
      -- Transactions Yesterday
      (SELECT COUNT(*) 
       FROM transactions 
       WHERE DATE(created_at) = CURRENT_DATE - 1
         AND deleted_at IS NULL) AS transactions_yesterday,
      
      -- Error Rate (last 1h) - from audit_logs with error results
      (SELECT COALESCE(
        ROUND(
          (COUNT(*) FILTER (WHERE result = 'failure')::DECIMAL / 
           NULLIF(COUNT(*), 0) * 100), 2
        ), 0.0
       ) FROM audit_logs 
       WHERE timestamp > NOW() - INTERVAL '1 hour') AS error_rate,
      
      -- System Health (uptime %) - placeholder
      (SELECT 99.9) AS system_health,
      
      -- Total Households
      (SELECT COUNT(*) FROM households WHERE deleted_at IS NULL) AS total_households,
      
      -- Total Users (household members)
      (SELECT COUNT(DISTINCT user_id) FROM household_members) AS total_users
  )
  SELECT json_build_object(
    'activeUsers', json_build_object(
      'value', active_users,
      'delta', ROUND((active_users - active_users_yesterday)::DECIMAL / 
                     NULLIF(active_users_yesterday, 0) * 100, 1)
    ),
    'transactionsToday', json_build_object(
      'value', transactions_today,
      'delta', ROUND((transactions_today - transactions_yesterday)::DECIMAL / 
                     NULLIF(transactions_yesterday, 0) * 100, 1)
    ),
    'errorRate', json_build_object(
      'value', error_rate,
      'delta', 0.0
    ),
    'systemHealth', json_build_object(
      'value', system_health,
      'incidents', 0
    ),
    'totalHouseholds', total_households,
    'totalUsers', total_users
  ) INTO result FROM metrics;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_dashboard_metrics() IS 
'Returns aggregated dashboard metrics. Requires admin privileges. Uses SECURITY DEFINER to access all tables.';

-- ============================================================================
-- Verify other admin RPC functions also have proper checks
-- ============================================================================

-- If get_database_metrics exists, add admin check
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_database_metrics'
  ) THEN
    -- This function is called by useSystemHealth
    -- It should also verify admin access
    EXECUTE '
    CREATE OR REPLACE FUNCTION get_database_metrics()
    RETURNS JSON AS $func$
    BEGIN
      IF NOT is_admin() THEN
        RAISE EXCEPTION ''Access denied. Admin privileges required.'';
      END IF;
      
      -- Return mock metrics for now
      RETURN json_build_object(
        ''cpu'', 45,
        ''connections'', 12,
        ''memory_usage'', 60
      );
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
    ';
  END IF;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================
