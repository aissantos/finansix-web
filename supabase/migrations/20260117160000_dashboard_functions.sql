-- Migration: Dashboard Metrics RPC Function
-- Created: 2026-01-17
-- Purpose: Aggregate dashboard metrics efficiently with delta calculations
-- Uses existing Finansix tables: household_members, transactions, audit_logs

-- Function to get dashboard metrics
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
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
      
      -- System Health (uptime %) - placeholder, calculate based on your needs
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_dashboard_metrics() IS 'Returns aggregated dashboard metrics using existing Finansix tables (household_members, transactions, audit_logs)';
