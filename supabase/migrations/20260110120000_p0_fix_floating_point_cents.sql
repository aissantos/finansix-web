-- ============================================================================
-- Migration: P0 - Fix Floating Point (Add Cents Columns)
-- Version: 1.5.3.0
-- Date: 2026-01-10
-- Critical: Eliminates floating point precision errors
-- ============================================================================

-- ============================================================================
-- 1. TRANSACTIONS - Add amount_cents
-- ============================================================================

ALTER TABLE transactions 
  ADD COLUMN amount_cents BIGINT;

-- Migrate existing data (CRITICAL: Preserve precision)
UPDATE transactions 
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents IS NULL;

-- Make NOT NULL after migration
ALTER TABLE transactions 
  ALTER COLUMN amount_cents SET NOT NULL;

-- Add check constraint (positive amounts only)
ALTER TABLE transactions
  ADD CONSTRAINT transactions_amount_cents_positive 
  CHECK (amount_cents > 0);

-- Create index for performance
CREATE INDEX idx_transactions_amount_cents ON transactions(amount_cents);

-- ============================================================================
-- 2. INSTALLMENTS - Add amount_cents
-- ============================================================================

ALTER TABLE installments 
  ADD COLUMN amount_cents BIGINT;

UPDATE installments 
  SET amount_cents = ROUND(amount * 100)
  WHERE amount_cents IS NULL;

ALTER TABLE installments 
  ALTER COLUMN amount_cents SET NOT NULL;

ALTER TABLE installments
  ADD CONSTRAINT installments_amount_cents_positive 
  CHECK (amount_cents > 0);

CREATE INDEX idx_installments_amount_cents ON installments(amount_cents);

-- ============================================================================
-- 3. ACCOUNTS - Add current_balance_cents
-- ============================================================================

ALTER TABLE accounts 
  ADD COLUMN current_balance_cents BIGINT;

UPDATE accounts 
  SET current_balance_cents = ROUND(current_balance * 100)
  WHERE current_balance_cents IS NULL;

ALTER TABLE accounts 
  ALTER COLUMN current_balance_cents SET NOT NULL,
  ALTER COLUMN current_balance_cents SET DEFAULT 0;

CREATE INDEX idx_accounts_balance_cents ON accounts(current_balance_cents);

-- ============================================================================
-- 4. CREDIT_CARDS - Add limit_cents (available_limit é calculado em VIEW)
-- ============================================================================

ALTER TABLE credit_cards 
  ADD COLUMN credit_limit_cents BIGINT;

UPDATE credit_cards 
  SET credit_limit_cents = ROUND(credit_limit * 100)
  WHERE credit_limit_cents IS NULL;

ALTER TABLE credit_cards 
  ALTER COLUMN credit_limit_cents SET NOT NULL;

ALTER TABLE credit_cards
  ADD CONSTRAINT credit_cards_limit_cents_positive 
  CHECK (credit_limit_cents >= 0);

CREATE INDEX idx_credit_cards_limit_cents ON credit_cards(credit_limit_cents);

-- ============================================================================
-- 5. UPDATE VIEWS TO USE CENTS
-- ============================================================================

-- Drop old view
DROP VIEW IF EXISTS transactions_with_installments_expanded;

-- Recreate with cents
CREATE OR REPLACE VIEW transactions_with_installments_expanded AS
SELECT 
  t.id,
  t.household_id,
  t.category_id,
  t.account_id,
  t.credit_card_id,
  t.description,
  t.type,
  t.status,
  t.transaction_date,
  t.amount,
  t.amount_cents,  -- NEW
  t.total_installments,
  COALESCE(i.installment_number, 1) AS installment_number,
  COALESCE(i.due_date, t.transaction_date) AS due_date,
  COALESCE(i.amount, t.amount) AS installment_amount,
  COALESCE(i.amount_cents, t.amount_cents) AS installment_amount_cents,  -- NEW
  i.status AS installment_status,
  i.id AS installment_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  COALESCE(cc.name, a.name) AS account_name,
  t.notes,
  t.is_essential,
  t.is_recurring,
  t.is_reimbursable,
  t.reimbursement_status,
  t.reimbursed_amount,
  t.reimbursed_amount * 100 AS reimbursed_amount_cents,  -- NEW
  t.created_at,
  t.updated_at,
  t.deleted_at
FROM transactions t
LEFT JOIN installments i ON i.transaction_id = t.id AND i.deleted_at IS NULL
LEFT JOIN categories c ON c.id = t.category_id
LEFT JOIN credit_cards cc ON cc.id = t.credit_card_id
LEFT JOIN accounts a ON a.id = t.account_id
WHERE t.deleted_at IS NULL;

-- Update credit_card_limits view to include cents
DROP VIEW IF EXISTS credit_card_limits;

CREATE VIEW credit_card_limits AS
SELECT 
  cc.id,
  cc.household_id,
  cc.name,
  cc.credit_limit,
  cc.credit_limit_cents,  -- NEW
  COALESCE(
    (SELECT SUM(i.amount) 
     FROM installments i 
     WHERE i.credit_card_id = cc.id 
       AND i.status = 'pending'
       AND i.deleted_at IS NULL
       AND i.billing_month <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
    0
  ) as used_limit,
  COALESCE(
    (SELECT SUM(i.amount_cents) 
     FROM installments i 
     WHERE i.credit_card_id = cc.id 
       AND i.status = 'pending'
       AND i.deleted_at IS NULL
       AND i.billing_month <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
    0
  ) as used_limit_cents,  -- NEW
  cc.credit_limit - COALESCE(
    (SELECT SUM(i.amount) 
     FROM installments i 
     WHERE i.credit_card_id = cc.id 
       AND i.status = 'pending'
       AND i.deleted_at IS NULL
       AND i.billing_month <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
    0
  ) as available_limit,
  cc.credit_limit_cents - COALESCE(
    (SELECT SUM(i.amount_cents) 
     FROM installments i 
     WHERE i.credit_card_id = cc.id 
       AND i.status = 'pending'
       AND i.deleted_at IS NULL
       AND i.billing_month <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
    0
  ) as available_limit_cents  -- NEW
FROM credit_cards cc
WHERE cc.deleted_at IS NULL 
  AND cc.is_active = TRUE
GROUP BY cc.id;

GRANT SELECT ON credit_card_limits TO authenticated;

-- ============================================================================
-- 6. UPDATE TRIGGERS TO USE CENTS
-- ============================================================================

-- Update create_installments trigger to use cents
CREATE OR REPLACE FUNCTION create_installments()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
  installment_amount_cents BIGINT;
  installment_date DATE;
BEGIN
  -- Only for installment transactions (total_installments > 1)
  IF NEW.total_installments > 1 THEN
    -- Calculate installment amount in CENTS (no floating point!)
    installment_amount_cents := NEW.amount_cents / NEW.total_installments;
    
    -- Create installments
    FOR i IN 1..NEW.total_installments LOOP
      installment_date := NEW.transaction_date + ((i - 1) * INTERVAL '1 month');
      
      INSERT INTO installments (
        household_id,
        transaction_id,
        installment_number,
        due_date,
        amount,
        amount_cents,
        status
      ) VALUES (
        NEW.household_id,
        NEW.id,
        i,
        installment_date,
        installment_amount_cents::numeric / 100,  -- Convert back to decimal for legacy
        installment_amount_cents,
        'pending'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. HELPER FUNCTION - Cents to Reais
-- ============================================================================

CREATE OR REPLACE FUNCTION cents_to_reais(amount_cents BIGINT)
RETURNS NUMERIC(15, 2) AS $$
BEGIN
  RETURN amount_cents::numeric / 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Grant execute
GRANT EXECUTE ON FUNCTION cents_to_reais(BIGINT) TO authenticated;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON COLUMN transactions.amount_cents IS 
'Amount in cents (INTEGER) to avoid floating point precision errors. Primary source of truth.';

COMMENT ON COLUMN installments.amount_cents IS 
'Installment amount in cents (INTEGER). Primary source of truth.';

COMMENT ON COLUMN accounts.current_balance_cents IS 
'Account balance in cents (INTEGER). Primary source of truth.';

COMMENT ON COLUMN credit_cards.credit_limit_cents IS 
'Credit limit in cents (INTEGER). Primary source of truth.';

COMMENT ON FUNCTION cents_to_reais(BIGINT) IS 
'Convert cents (BIGINT) to reais (NUMERIC). Use for display only.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify migration
-- SELECT 
--   COUNT(*) as total,
--   COUNT(amount_cents) as migrated,
--   COUNT(*) - COUNT(amount_cents) as pending
-- FROM transactions;

-- Compare precision
-- SELECT 
--   id,
--   amount as old_decimal,
--   amount_cents as new_cents,
--   cents_to_reais(amount_cents) as converted_back,
--   amount - cents_to_reais(amount_cents) as diff
-- FROM transactions
-- WHERE ABS(amount - cents_to_reais(amount_cents)) > 0.01
-- LIMIT 10;
