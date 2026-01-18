-- Sprint 4: Analytics & Reporting - Database Schema
-- Migration: 20260119000000_analytics_schema.sql

-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================
-- Tracks user activity events for analytics purposes

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type 
  ON analytics_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user 
  ON analytics_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_household 
  ON analytics_events(household_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created 
  ON analytics_events(created_at DESC);

COMMENT ON TABLE analytics_events IS 'Stores user activity events for analytics and reporting';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event (e.g., login, transaction_created, report_generated)';
COMMENT ON COLUMN analytics_events.metadata IS 'Additional event data in JSON format';

-- ============================================================================
-- SAVED REPORTS TABLE
-- ============================================================================
-- Stores custom report configurations created by admins

CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_reports_admin 
  ON saved_reports(admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_reports_public 
  ON saved_reports(is_public, created_at DESC) 
  WHERE is_public = TRUE;

COMMENT ON TABLE saved_reports IS 'Custom report configurations saved by administrators';
COMMENT ON COLUMN saved_reports.config IS 'Report configuration including filters, metrics, and display options';
COMMENT ON COLUMN saved_reports.is_public IS 'Whether this report is visible to all admins';

-- ============================================================================
-- RPC FUNCTIONS FOR ANALYTICS
-- ============================================================================

-- Function: Get User Activity Metrics (DAU/WAU/MAU)
CREATE OR REPLACE FUNCTION get_user_activity_metrics(
  p_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'dau', (
      SELECT COUNT(DISTINCT user_id) 
      FROM analytics_events 
      WHERE created_at >= DATE_TRUNC('day', p_date) 
        AND created_at < DATE_TRUNC('day', p_date) + INTERVAL '1 day'
    ),
    'wau', (
      SELECT COUNT(DISTINCT user_id) 
      FROM analytics_events 
      WHERE created_at >= DATE_TRUNC('week', p_date) 
        AND created_at < DATE_TRUNC('week', p_date) + INTERVAL '1 week'
    ),
    'mau', (
      SELECT COUNT(DISTINCT user_id) 
      FROM analytics_events 
      WHERE created_at >= DATE_TRUNC('month', p_date) 
        AND created_at < DATE_TRUNC('month', p_date) + INTERVAL '1 month'
    ),
    'total_events', (
      SELECT COUNT(*) 
      FROM analytics_events 
      WHERE created_at >= DATE_TRUNC('day', p_date) 
        AND created_at < DATE_TRUNC('day', p_date) + INTERVAL '1 day'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_activity_metrics IS 'Returns DAU, WAU, MAU metrics for a given date';

-- Function: Get Transaction Analytics
CREATE OR REPLACE FUNCTION get_transaction_analytics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_household_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_transactions', COUNT(*),
    'total_income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    'total_expense', COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    'net_balance', COALESCE(
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0
    ),
    'avg_transaction', COALESCE(AVG(amount), 0),
    'by_category', (
      SELECT json_agg(
        json_build_object(
          'category_id', category_id,
          'count', COUNT(*),
          'total', SUM(amount),
          'avg', AVG(amount)
        )
      )
      FROM transactions
      WHERE created_at >= p_start_date 
        AND created_at < p_end_date
        AND (p_household_id IS NULL OR household_id = p_household_id)
        AND deleted_at IS NULL
      GROUP BY category_id
    ),
    'by_type', (
      SELECT json_agg(
        json_build_object(
          'type', type,
          'count', COUNT(*),
          'total', SUM(amount)
        )
      )
      FROM transactions
      WHERE created_at >= p_start_date 
        AND created_at < p_end_date
        AND (p_household_id IS NULL OR household_id = p_household_id)
        AND deleted_at IS NULL
      GROUP BY type
    ),
    'daily_trend', (
      SELECT json_agg(
        json_build_object(
          'date', DATE(created_at),
          'count', COUNT(*),
          'total', SUM(amount)
        ) ORDER BY DATE(created_at)
      )
      FROM transactions
      WHERE created_at >= p_start_date 
        AND created_at < p_end_date
        AND (p_household_id IS NULL OR household_id = p_household_id)
        AND deleted_at IS NULL
      GROUP BY DATE(created_at)
    )
  ) INTO result
  FROM transactions
  WHERE created_at >= p_start_date 
    AND created_at < p_end_date
    AND (p_household_id IS NULL OR household_id = p_household_id)
    AND deleted_at IS NULL;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_transaction_analytics IS 'Returns comprehensive transaction analytics for a date range';

-- Function: Get Household Growth Metrics
CREATE OR REPLACE FUNCTION get_household_growth_metrics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_households', (
      SELECT COUNT(*) 
      FROM households 
      WHERE created_at < p_end_date 
        AND deleted_at IS NULL
    ),
    'new_households', (
      SELECT COUNT(*) 
      FROM households 
      WHERE created_at >= p_start_date 
        AND created_at < p_end_date
        AND deleted_at IS NULL
    ),
    'active_households', (
      SELECT COUNT(DISTINCT household_id) 
      FROM transactions 
      WHERE created_at >= p_start_date 
        AND created_at < p_end_date
        AND deleted_at IS NULL
    ),
    'by_date', (
      SELECT json_agg(
        json_build_object(
          'date', DATE(created_at),
          'count', COUNT(*)
        ) ORDER BY DATE(created_at)
      )
      FROM households
      WHERE created_at >= p_start_date 
        AND created_at < p_end_date
        AND deleted_at IS NULL
      GROUP BY DATE(created_at)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_household_growth_metrics IS 'Returns household growth and activity metrics';

-- Function: Get Category Distribution
CREATE OR REPLACE FUNCTION get_category_distribution(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_type TEXT DEFAULT NULL
) RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'category_id', c.id,
        'category_name', c.name,
        'category_type', c.type,
        'transaction_count', COUNT(t.id),
        'total_amount', COALESCE(SUM(t.amount), 0),
        'avg_amount', COALESCE(AVG(t.amount), 0),
        'percentage', ROUND(
          (COUNT(t.id)::NUMERIC / NULLIF(SUM(COUNT(t.id)) OVER (), 0) * 100), 2
        )
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

COMMENT ON FUNCTION get_category_distribution IS 'Returns transaction distribution by category';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- Analytics Events: Only service role can access
CREATE POLICY "Service role full access on analytics_events"
  ON analytics_events FOR ALL
  USING (auth.role() = 'service_role');

-- Saved Reports: Admins can manage their own reports
CREATE POLICY "Admins can view their own reports"
  ON saved_reports FOR SELECT
  USING (
    admin_id = auth.uid() 
    OR is_public = TRUE
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Admins can create reports"
  ON saved_reports FOR INSERT
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update their own reports"
  ON saved_reports FOR UPDATE
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can delete their own reports"
  ON saved_reports FOR DELETE
  USING (admin_id = auth.uid());

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION get_user_activity_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_household_growth_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_category_distribution TO authenticated;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample analytics events
INSERT INTO analytics_events (event_type, user_id, household_id, metadata)
SELECT 
  'page_view',
  u.id,
  hm.household_id,
  json_build_object('page', '/dashboard', 'duration', floor(random() * 300))
FROM auth.users u
JOIN household_members hm ON hm.user_id = u.id
LIMIT 100
ON CONFLICT DO NOTHING;

-- Migration complete
COMMENT ON SCHEMA public IS 'Sprint 4: Analytics schema added successfully';
