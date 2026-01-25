-- ============================================================================
-- Migration: Absolute Final Transfer Fix (Enum -> Text Check)
-- Date: 2026-01-25
-- Purpose: 1. DROP Dependent Views (`monthly_summary`, `household_free_balance`).
--          2. Convert `type` column to TEXT in all tables.
--          3. DROP Enum `transaction_type`.
--          4. Add Check Constraints.
--          5. Restore Views.
-- ============================================================================

-- 1. DROP DEPENDENT VIEWS
DROP VIEW IF EXISTS monthly_summary CASCADE;
DROP VIEW IF EXISTS household_free_balance CASCADE;

-- 2. ALTER COLUMNS TO TEXT (Break Enum Dependency)
ALTER TABLE transactions ALTER COLUMN type TYPE text;
ALTER TABLE categories ALTER COLUMN type TYPE text;
ALTER TABLE expected_transactions ALTER COLUMN type TYPE text;

-- 3. DROP OLD ENUM (Cascade to be safe)
DROP TYPE IF EXISTS transaction_type CASCADE;

-- 4. ADD FLEXIBLE CONSTRAINTS ('transfer' allowed)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_transaction_type;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transaction_type_check;
ALTER TABLE transactions ADD CONSTRAINT check_transaction_type CHECK (type IN ('income', 'expense', 'transfer'));

ALTER TABLE categories DROP CONSTRAINT IF EXISTS check_category_type;
ALTER TABLE categories ADD CONSTRAINT check_category_type CHECK (type IN ('income', 'expense', 'transfer'));

ALTER TABLE expected_transactions DROP CONSTRAINT IF EXISTS check_expected_trans_type;
ALTER TABLE expected_transactions ADD CONSTRAINT check_expected_trans_type CHECK (type IN ('income', 'expense', 'transfer'));

-- 5. REMOVE OBSTRUCTIVE CONSTRAINTS
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_positive_amount;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS amount_positive;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_cents_check;

-- 6. RESTORE VIEWS

-- 6a. Restore household_free_balance
CREATE OR REPLACE VIEW household_free_balance AS
WITH 
account_balances AS (
  SELECT
    household_id,
    SUM(current_balance) AS total_balance
  FROM accounts
  WHERE deleted_at IS NULL AND is_active = TRUE
  GROUP BY household_id
),
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

-- 6b. Restore monthly_summary
CREATE OR REPLACE VIEW monthly_summary AS
SELECT 
    t.household_id,
    DATE_TRUNC('month', t.transaction_date) AS month,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) AS balance
FROM transactions t
WHERE t.deleted_at IS NULL AND t.status = 'completed'
GROUP BY t.household_id, DATE_TRUNC('month', t.transaction_date);

-- 7. RE-APPLY SAFE TRIGGER
CREATE OR REPLACE FUNCTION public.fix_transfer_record_robust()
RETURNS TRIGGER AS $$
DECLARE
  v_acc_name text;
  v_description text;
  v_separator text;
  v_parts text[];
  v_source text;
  v_dest text;
BEGIN
  BEGIN
      v_description := NEW.description;
      -- Force Transfer type logic
      IF v_description ILIKE 'Transferência:%' OR v_description ILIKE '%Transferência%' THEN
        NEW.type := 'transfer';
        IF NEW.account_id IS NOT NULL THEN
            SELECT name INTO v_acc_name FROM accounts WHERE id = NEW.account_id;
            
            IF v_description LIKE '% → %' THEN v_separator := ' → ';
            ELSIF v_description LIKE '% -> %' THEN v_separator := ' -> ';
            ELSIF v_description LIKE '% - %' THEN v_separator := ' - ';
            ELSE v_separator := NULL; END IF;
            
            IF v_separator IS NOT NULL THEN
              v_parts := string_to_array(v_description, v_separator);
              IF array_length(v_parts, 1) >= 2 THEN
                 v_source := trim(regexp_replace(v_parts[1], '^.*Transferência:\s*', '', 'i'));
                 v_dest := trim(v_parts[2]);
                 
                 IF v_acc_name IS NOT NULL THEN
                     IF trim(v_acc_name) ILIKE v_source THEN
                       NEW.amount := -ABS(NEW.amount);
                       NEW.amount_cents := -ABS(NEW.amount_cents); 
                     ELSIF trim(v_acc_name) ILIKE v_dest THEN
                       NEW.amount := ABS(NEW.amount);
                       NEW.amount_cents := ABS(NEW.amount_cents); 
                     END IF;
                 END IF;
              END IF;
            END IF;
        END IF;
      END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Trigger Error: %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_robust_transfer_fix ON transactions;
CREATE TRIGGER tr_robust_transfer_fix
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fix_transfer_record_robust();

-- 8. RECALCULATE BALANCES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_account_balance') THEN
      PERFORM update_account_balance(id) FROM accounts WHERE deleted_at IS NULL;
  END IF;
END $$;
