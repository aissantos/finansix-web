-- Migration: Subscriptions Table
-- Manages recurring payments/subscriptions

-- ============================================================================
-- 1. Create subscriptions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  
  -- Subscription details
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  billing_day INTEGER NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  
  -- Categorization
  category VARCHAR(50),
  icon VARCHAR(10), -- Emoji icon
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_household_id 
  ON subscriptions(household_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_credit_card_id 
  ON subscriptions(credit_card_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_active 
  ON subscriptions(household_id, is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_day 
  ON subscriptions(billing_day);

-- ============================================================================
-- 3. RLS Policies
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view household subscriptions" ON subscriptions;
CREATE POLICY "Users can view household subscriptions" ON subscriptions
  FOR SELECT
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can create subscriptions" ON subscriptions;
CREATE POLICY "Users can create subscriptions" ON subscriptions
  FOR INSERT
  WITH CHECK (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can update household subscriptions" ON subscriptions;
CREATE POLICY "Users can update household subscriptions" ON subscriptions
  FOR UPDATE
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can delete household subscriptions" ON subscriptions;
CREATE POLICY "Users can delete household subscriptions" ON subscriptions
  FOR DELETE
  USING (household_id = _secured.user_household_id());

-- ============================================================================
-- 4. Trigger to update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================================
-- 5. Function to get monthly subscription total
-- ============================================================================
-- NOTE: Removed SECURITY DEFINER so it respects RLS automatically
CREATE OR REPLACE FUNCTION get_subscription_total(p_household_id UUID)
RETURNS DECIMAL(12,2) AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM subscriptions
  WHERE household_id = p_household_id
    AND is_active = TRUE;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- 6. Function to get upcoming subscriptions (next 7 days)
-- ============================================================================
-- NOTE: Removed SECURITY DEFINER so it respects RLS automatically
CREATE OR REPLACE FUNCTION get_upcoming_subscriptions(p_household_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  amount DECIMAL(12,2),
  billing_day INTEGER,
  days_until INTEGER,
  credit_card_id UUID
) AS $$
DECLARE
  today_day INTEGER := EXTRACT(DAY FROM CURRENT_DATE);
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.amount,
    s.billing_day,
    CASE 
      WHEN s.billing_day >= today_day THEN s.billing_day - today_day
      ELSE 30 - today_day + s.billing_day
    END AS days_until,
    s.credit_card_id
  FROM subscriptions s
  WHERE s.household_id = p_household_id
    AND s.is_active = TRUE
    AND (
      (s.billing_day >= today_day AND s.billing_day <= today_day + 7)
      OR (today_day > 24 AND s.billing_day <= 7 - (30 - today_day))
    )
  ORDER BY days_until;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. Comment for documentation
-- ============================================================================
COMMENT ON TABLE subscriptions IS 
'Stores recurring subscription payments. Used to track monthly costs and predict cash flow.';