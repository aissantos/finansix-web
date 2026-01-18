-- Fix: Type casting for transaction type comparisons
-- Migration: 20260119000003_fix_transaction_type_cast.sql

-- Drop and recreate get_transaction_analytics with proper type casting
DROP FUNCTION IF EXISTS get_transaction_analytics(TIMESTAMPTZ, TIMESTAMPTZ, UUID);

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
  -- Get basic aggregates (with explicit type casting)
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN type::text = 'income' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type::text = 'expense' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type::text = 'income' THEN amount ELSE -amount END), 0),
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

  -- Get type breakdown (with explicit type casting)
  SELECT json_agg(
    json_build_object(
      'type', type::text,
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

COMMENT ON FUNCTION get_transaction_analytics IS 'Returns comprehensive transaction analytics (with type casting)';

-- Also fix get_category_distribution if it has type issues
DROP FUNCTION IF EXISTS get_category_distribution(TIMESTAMPTZ, TIMESTAMPTZ, TEXT);

CREATE OR REPLACE FUNCTION get_category_distribution(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_type TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_total_count NUMERIC;
BEGIN
  -- First, get the total count
  SELECT COALESCE(SUM(transaction_count), 0) INTO v_total_count
  FROM (
    SELECT COUNT(t.id) as transaction_count
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
      AND t.created_at >= p_start_date
      AND t.created_at < p_end_date
      AND t.deleted_at IS NULL
      AND (p_type IS NULL OR t.type::text = p_type)
    WHERE c.deleted_at IS NULL
    GROUP BY c.id
    HAVING COUNT(t.id) > 0
  ) counts;

  -- Then build the result with percentages
  RETURN (
    SELECT json_agg(
      json_build_object(
        'category_id', c.id,
        'category_name', c.name,
        'category_type', c.type::text,
        'transaction_count', COUNT(t.id),
        'total_amount', COALESCE(SUM(t.amount), 0),
        'avg_amount', COALESCE(AVG(t.amount), 0),
        'percentage', CASE 
          WHEN v_total_count > 0 THEN ROUND((COUNT(t.id)::NUMERIC / v_total_count * 100), 2)
          ELSE 0
        END
      )
    )
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
      AND t.created_at >= p_start_date
      AND t.created_at < p_end_date
      AND t.deleted_at IS NULL
      AND (p_type IS NULL OR t.type::text = p_type)
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.type
    HAVING COUNT(t.id) > 0
    ORDER BY COUNT(t.id) DESC
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_category_distribution IS 'Returns transaction distribution by category (with type casting)';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_transaction_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_distribution TO authenticated;
