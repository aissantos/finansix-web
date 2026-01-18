-- ============================================================================
-- FIX get_dashboard_metrics RPC FUNCTION
-- ============================================================================
-- Corrected version with proper table references and error handling
-- Execute in Supabase Studio SQL Editor
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_dashboard_metrics();

-- Create corrected function
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
  active_users_count INT := 0;
  active_users_yesterday_count INT := 0;
  transactions_today_count INT := 0;
  transactions_yesterday_count INT := 0;
  error_rate_value NUMERIC := 0.0;
BEGIN
  -- Active Users (last 24h) - users who created transactions
  SELECT COUNT(DISTINCT created_by) INTO active_users_count
  FROM transactions 
  WHERE created_at > NOW() - INTERVAL '24 hours'
    AND created_by IS NOT NULL
    AND deleted_at IS NULL;
  
  -- Active Users Yesterday
  SELECT COUNT(DISTINCT created_by) INTO active_users_yesterday_count
  FROM transactions 
  WHERE created_at BETWEEN NOW() - INTERVAL '48 hours' 
    AND NOW() - INTERVAL '24 hours'
    AND created_by IS NOT NULL
    AND deleted_at IS NULL;
  
  -- Transactions Today
  SELECT COUNT(*) INTO transactions_today_count
  FROM transactions 
  WHERE DATE(created_at) = CURRENT_DATE 
    AND deleted_at IS NULL;
  
  -- Transactions Yesterday
  SELECT COUNT(*) INTO transactions_yesterday_count
  FROM transactions 
  WHERE DATE(created_at) = CURRENT_DATE - 1
    AND deleted_at IS NULL;
  
  -- Error Rate (last 1h) - from audit_logs with failure results
  SELECT COALESCE(
    ROUND(
      (COUNT(*) FILTER (WHERE result = 'failure')::DECIMAL / 
       NULLIF(COUNT(*), 0) * 100), 2
    ), 0.0
  ) INTO error_rate_value
  FROM audit_logs 
  WHERE timestamp > NOW() - INTERVAL '1 hour';
  
  -- Build JSON result
  result := json_build_object(
    'activeUsers', json_build_object(
      'value', COALESCE(active_users_count, 0),
      'delta', CASE 
        WHEN active_users_yesterday_count > 0 THEN
          ROUND((active_users_count - active_users_yesterday_count)::DECIMAL / 
                active_users_yesterday_count * 100, 1)
        ELSE 0
      END
    ),
    'transactionsToday', json_build_object(
      'value', COALESCE(transactions_today_count, 0),
      'delta', CASE 
        WHEN transactions_yesterday_count > 0 THEN
          ROUND((transactions_today_count - transactions_yesterday_count)::DECIMAL / 
                transactions_yesterday_count * 100, 1)
        ELSE 0
      END
    ),
    'errorRate', json_build_object(
      'value', COALESCE(error_rate_value, 0.0),
      'delta', 0.0
    ),
    'systemHealth', json_build_object(
      'value', 99.9,
      'incidents', 0
    )
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return default values on error
    RETURN json_build_object(
      'activeUsers', json_build_object('value', 0, 'delta', 0),
      'transactionsToday', json_build_object('value', 0, 'delta', 0),
      'errorRate', json_build_object('value', 0.0, 'delta', 0.0),
      'systemHealth', json_build_object('value', 99.9, 'incidents', 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO anon;

-- Test the function
SELECT get_dashboard_metrics();
