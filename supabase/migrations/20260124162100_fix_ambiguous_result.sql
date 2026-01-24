-- ============================================================================
-- Migration: Fix Ambiguous Column Reference in get_dashboard_metrics
-- Date: 2026-01-24
-- Purpose: Rename 'result' variable to 'metrics_result' to avoid conflict
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
  metrics_result JSON;  -- Renamed from 'result' to avoid conflict with audit_logs.result column
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
          (COUNT(*) FILTER (WHERE audit_logs.result = 'failure')::DECIMAL / 
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
  ) INTO metrics_result FROM metrics;
  
  RETURN metrics_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_dashboard_metrics() IS 
'Returns aggregated dashboard metrics. Requires admin privileges. Uses SECURITY DEFINER to access all tables.';
