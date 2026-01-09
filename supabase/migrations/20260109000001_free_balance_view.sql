-- Migration: Optimized Free Balance View
-- Reduces N+1 queries by pre-aggregating all balance calculations

-- ============================================================================
-- 1. Create optimized view for household free balance
-- ============================================================================

CREATE OR REPLACE VIEW household_free_balance AS
WITH 
-- Current account balances
account_balances AS (
  SELECT
    household_id,
    SUM(current_balance) AS total_balance
  FROM accounts
  WHERE deleted_at IS NULL AND is_active = TRUE
  GROUP BY household_id
),

-- Pending non-credit expenses
pending_expenses AS (
  SELECT
    household_id,
    COALESCE(SUM(amount), 0) AS total_pending
  FROM transactions
  WHERE 
    type = 'expense'
    AND status = 'pending'
    AND credit_card_id IS NULL
    AND deleted_at IS NULL
  GROUP BY household_id
),

-- Pending credit card installments for current month
credit_card_due AS (
  SELECT
    cc.household_id,
    COALESCE(SUM(i.amount), 0) AS total_due
  FROM installments i
  JOIN credit_cards cc ON cc.id = i.credit_card_id
  WHERE 
    i.status = 'pending'
    AND to_char(i.billing_month, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
    AND cc.deleted_at IS NULL
  GROUP BY cc.household_id
),

-- Expected income (with confidence weighting)
expected_income AS (
  SELECT
    household_id,
    COALESCE(SUM(
      amount * (COALESCE(confidence_percent, 100) / 100.0)
    ), 0) AS total_expected
  FROM expected_transactions
  WHERE 
    type = 'income'
    AND is_active = TRUE
  GROUP BY household_id
),

-- Expected expenses
expected_expenses AS (
  SELECT
    household_id,
    COALESCE(SUM(amount), 0) AS total_expected
  FROM expected_transactions
  WHERE 
    type = 'expense'
    AND is_active = TRUE
  GROUP BY household_id
)

SELECT
  h.id AS household_id,
  h.name AS household_name,
  COALESCE(ab.total_balance, 0) AS current_balance,
  COALESCE(pe.total_pending, 0) AS pending_expenses,
  COALESCE(cc.total_due, 0) AS credit_card_due,
  COALESCE(ei.total_expected, 0) AS expected_income,
  COALESCE(ee.total_expected, 0) AS expected_expenses,
  COALESCE(ab.total_balance, 0) 
    - COALESCE(pe.total_pending, 0) 
    - COALESCE(cc.total_due, 0)
    + COALESCE(ei.total_expected, 0)
    - COALESCE(ee.total_expected, 0) AS free_balance
FROM households h
LEFT JOIN account_balances ab ON ab.household_id = h.id
LEFT JOIN pending_expenses pe ON pe.household_id = h.id
LEFT JOIN credit_card_due cc ON cc.household_id = h.id
LEFT JOIN expected_income ei ON ei.household_id = h.id
LEFT JOIN expected_expenses ee ON ee.household_id = h.id
WHERE h.deleted_at IS NULL;

-- ============================================================================
-- 2. Create function for parameterized free balance calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION get_household_free_balance(
  p_household_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  household_id UUID,
  household_name VARCHAR,
  current_balance DECIMAL(15,2),
  pending_expenses DECIMAL(15,2),
  credit_card_due DECIMAL(15,2),
  expected_income DECIMAL(15,2),
  expected_expenses DECIMAL(15,2),
  free_balance DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH 
  -- Account balances
  account_balances AS (
    SELECT SUM(current_balance) AS total_balance
    FROM accounts
    WHERE 
      household_id = p_household_id
      AND deleted_at IS NULL 
      AND is_active = TRUE
  ),
  
  -- Pending expenses up to target date
  pending_expenses AS (
    SELECT COALESCE(SUM(amount), 0) AS total_pending
    FROM transactions
    WHERE 
      household_id = p_household_id
      AND type = 'expense'
      AND status = 'pending'
      AND credit_card_id IS NULL
      AND transaction_date <= p_target_date
      AND deleted_at IS NULL
  ),
  
  -- Credit card installments for billing month
  credit_card_due AS (
    SELECT COALESCE(SUM(i.amount), 0) AS total_due
    FROM installments i
    JOIN credit_cards cc ON cc.id = i.credit_card_id
    WHERE 
      cc.household_id = p_household_id
      AND i.status = 'pending'
      AND to_char(i.billing_month, 'YYYY-MM') = to_char(p_target_date, 'YYYY-MM')
      AND cc.deleted_at IS NULL
  ),
  
  -- Expected income
  expected_income AS (
    SELECT COALESCE(SUM(amount * (COALESCE(confidence_percent, 100) / 100.0)), 0) AS total_expected
    FROM expected_transactions
    WHERE 
      household_id = p_household_id
      AND type = 'income'
      AND is_active = TRUE
  ),
  
  -- Expected expenses
  expected_expenses AS (
    SELECT COALESCE(SUM(amount), 0) AS total_expected
    FROM expected_transactions
    WHERE 
      household_id = p_household_id
      AND type = 'expense'
      AND is_active = TRUE
  )
  
  SELECT
    p_household_id,
    h.name,
    COALESCE(ab.total_balance, 0),
    COALESCE(pe.total_pending, 0),
    COALESCE(cc.total_due, 0),
    COALESCE(ei.total_expected, 0),
    COALESCE(ee.total_expected, 0),
    COALESCE(ab.total_balance, 0) 
      - COALESCE(pe.total_pending, 0) 
      - COALESCE(cc.total_due, 0)
      + COALESCE(ei.total_expected, 0)
      - COALESCE(ee.total_expected, 0)
  FROM households h
  CROSS JOIN account_balances ab
  CROSS JOIN pending_expenses pe
  CROSS JOIN credit_card_due cc
  CROSS JOIN expected_income ei
  CROSS JOIN expected_expenses ee
  WHERE h.id = p_household_id AND h.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER STABLE;

-- ============================================================================
-- 3. Create optimized indexes
-- ============================================================================

-- Composite index for transaction filtering
CREATE INDEX IF NOT EXISTS idx_transactions_household_type_status_date 
ON transactions(household_id, type, status, transaction_date) 
WHERE deleted_at IS NULL;

-- Index for installment billing month lookups
CREATE INDEX IF NOT EXISTS idx_installments_billing_month_status 
ON installments(credit_card_id, billing_month, status);

-- Index for expected transactions
CREATE INDEX IF NOT EXISTS idx_expected_transactions_household_type 
ON expected_transactions(household_id, type, is_active);

-- ============================================================================
-- 4. Grant permissions
-- ============================================================================

GRANT SELECT ON household_free_balance TO authenticated;
GRANT EXECUTE ON FUNCTION get_household_free_balance TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================