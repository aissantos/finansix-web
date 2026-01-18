-- Fix: All Analytics SQL Functions - Remove Nested Aggregates
-- Migration: 20260119000002_fix_all_analytics_functions.sql

-- ============================================================================
-- Drop existing functions
-- ============================================================================
DROP FUNCTION IF EXISTS get_transaction_analytics(TIMESTAMPTZ, TIMESTAMPTZ, UUID);
DROP FUNCTION IF EXISTS get_household_growth_metrics(TIMESTAMPTZ, TIMESTAMPTZ);

-- ============================================================================
-- Recreate get_transaction_analytics WITHOUT nested aggregates
-- ============================================================================
CREATE OR REPLACE FUNCTION get_transaction_analytics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_household_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_total_transactions BIGINT;
  v_total_income NUMERIC;
  v_total_expense NUMERIC;
  v_net_balance NUMERIC;
  v_avg_transaction NUMERIC;
  v_by_category JSON;
  v_by_type JSON;
  v_daily_trend JSON;
BEGIN
  -- Get basic aggregates
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0),
    COALESCE(AVG(amount), 0)
  INTO 
    v_total_transactions,
    v_total_income,
    v_total_expense,
    v_net_balance,
    v_avg_transaction
  FROM transactions
  WHERE created_at >= p_start_date 
    AND created_at < p_end_date
    AND (p_household_id IS NULL OR household_id = p_household_id)
    AND deleted_at IS NULL;

  -- Get category breakdown
  SELECT json_agg(
    json_build_object(
      'category_id', category_id,
      'count', cnt,
      'total', total,
      'avg', avg_amt
    )
  ) INTO v_by_category
  FROM (
    SELECT 
      category_id,
      COUNT(*) as cnt,
      SUM(amount) as total,
      AVG(amount) as avg_amt
    FROM transactions
    WHERE created_at >= p_start_date 
      AND created_at < p_end_date
      AND (p_household_id IS NULL OR household_id = p_household_id)
      AND deleted_at IS NULL
    GROUP BY category_id
  ) cat_data;

  -- Get type breakdown
  SELECT json_agg(
    json_build_object(
      'type', type,
      'count', cnt,
      'total', total
    )
  ) INTO v_by_type
  FROM (
    SELECT 
      type,
      COUNT(*) as cnt,
      SUM(amount) as total
    FROM transactions
    WHERE created_at >= p_start_date 
      AND created_at < p_end_date
      AND (p_household_id IS NULL OR household_id = p_household_id)
      AND deleted_at IS NULL
    GROUP BY type
  ) type_data;

  -- Get daily trend
  SELECT json_agg(
    json_build_object(
      'date', date,
      'count', cnt,
      'total', total
    ) ORDER BY date
  ) INTO v_daily_trend
  FROM (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as cnt,
      SUM(amount) as total
    FROM transactions
    WHERE created_at >= p_start_date 
      AND created_at < p_end_date
      AND (p_household_id IS NULL OR household_id = p_household_id)
      AND deleted_at IS NULL
    GROUP BY DATE(created_at)
  ) daily_data;

  -- Build final result
  v_result := json_build_object(
    'total_transactions', v_total_transactions,
    'total_income', v_total_income,
    'total_expense', v_total_expense,
    'net_balance', v_net_balance,
    'avg_transaction', v_avg_transaction,
    'by_category', COALESCE(v_by_category, '[]'::json),
    'by_type', COALESCE(v_by_type, '[]'::json),
    'daily_trend', COALESCE(v_daily_trend, '[]'::json)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_transaction_analytics IS 'Returns comprehensive transaction analytics (fixed nested aggregates)';

-- ============================================================================
-- Recreate get_household_growth_metrics WITHOUT nested aggregates
-- ============================================================================
CREATE OR REPLACE FUNCTION get_household_growth_metrics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_total_households BIGINT;
  v_new_households BIGINT;
  v_active_households BIGINT;
  v_by_date JSON;
BEGIN
  -- Get total households
  SELECT COUNT(*) INTO v_total_households
  FROM households 
  WHERE created_at < p_end_date 
    AND deleted_at IS NULL;

  -- Get new households
  SELECT COUNT(*) INTO v_new_households
  FROM households 
  WHERE created_at >= p_start_date 
    AND created_at < p_end_date
    AND deleted_at IS NULL;

  -- Get active households (with transactions)
  SELECT COUNT(DISTINCT household_id) INTO v_active_households
  FROM transactions 
  WHERE created_at >= p_start_date 
    AND created_at < p_end_date
    AND deleted_at IS NULL;

  -- Get daily breakdown
  SELECT json_agg(
    json_build_object(
      'date', date,
      'count', cnt
    ) ORDER BY date
  ) INTO v_by_date
  FROM (
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as cnt
    FROM households
    WHERE created_at >= p_start_date 
      AND created_at < p_end_date
      AND deleted_at IS NULL
    GROUP BY DATE(created_at)
  ) daily_data;

  -- Build final result
  v_result := json_build_object(
    'total_households', v_total_households,
    'new_households', v_new_households,
    'active_households', v_active_households,
    'by_date', COALESCE(v_by_date, '[]'::json)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_household_growth_metrics IS 'Returns household growth metrics (fixed nested aggregates)';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_transaction_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_household_growth_metrics TO authenticated;
