-- Fix: Analytics SQL Nested Aggregate Error
-- Migration: 20260119000001_fix_analytics_nested_aggregate.sql

-- Drop and recreate get_category_distribution with fixed SQL
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
      AND (p_type IS NULL OR t.type = p_type)
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
        'category_type', c.type,
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
      AND (p_type IS NULL OR t.type = p_type)
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, c.name, c.type
    HAVING COUNT(t.id) > 0
    ORDER BY COUNT(t.id) DESC
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_category_distribution IS 'Returns transaction distribution by category (fixed nested aggregate)';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_category_distribution TO authenticated;
