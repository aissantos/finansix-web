-- ============================================================================
-- Migration: Absolute Final Transfer Fix (Enum -> Text Check)
-- Date: 2026-01-25
-- Purpose: 1. DROP Dependent Views & Functions (CASCADE).
--          2. Convert `type` column to TEXT in all tables.
--          3. DROP Enum `transaction_type`.
--          4. Add Check Constraints.
--          5. Restore Views & Functions.
-- ============================================================================

-- 1. DROP DEPENDENT VIEWS (CASCADE will handle dependent functions like get_monthly_transactions)
DROP VIEW IF EXISTS monthly_summary CASCADE;
DROP VIEW IF EXISTS household_free_balance CASCADE;
DROP VIEW IF EXISTS transactions_with_installments_expanded CASCADE;

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

-- 6. RESTORE VIEWS & FUNCTIONS

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

-- 6c. Restore transactions_with_installments_expanded
CREATE OR REPLACE VIEW transactions_with_installments_expanded AS
SELECT 
  CASE 
    WHEN t.is_installment = false OR t.total_installments IS NULL OR t.total_installments <= 1
    THEN t.id::text
    ELSE t.id::text || '-installment-' || i.installment_number::text
  END as virtual_id,
  
  t.id as transaction_id,
  t.household_id,
  t.type,
  t.description,
  
  CASE 
    WHEN t.is_installment = true AND i.id IS NOT NULL
    THEN i.amount
    ELSE t.amount
  END as amount,
  
  CASE 
    WHEN t.is_installment = true AND i.id IS NOT NULL
    THEN i.billing_month::date
    ELSE t.transaction_date
  END as transaction_date,
  
  t.category_id,
  t.account_id,
  t.credit_card_id,
  t.status,
  t.notes,
  t.is_installment,
  t.total_installments,
  
  i.installment_number,
  i.billing_month,
  i.due_date,
  i.id as installment_id,
  
  t.created_at,
  t.updated_at,
  t.deleted_at

FROM transactions t
LEFT JOIN installments i 
  ON t.id = i.transaction_id 
  AND t.is_installment = true
  AND i.deleted_at IS NULL

WHERE t.deleted_at IS NULL
  AND (
    t.is_installment = false 
    OR t.total_installments IS NULL 
    OR t.total_installments <= 1
    OR i.id IS NOT NULL
  );

GRANT SELECT ON transactions_with_installments_expanded TO authenticated;
GRANT SELECT ON transactions_with_installments_expanded TO service_role;

-- 6d. Restore get_monthly_transactions
CREATE OR REPLACE FUNCTION get_monthly_transactions(
  p_household_id uuid,
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  virtual_id text,
  transaction_id uuid,
  household_id uuid,
  type text,
  description text,
  amount numeric,
  transaction_date date,
  category_id uuid,
  account_id uuid,
  credit_card_id uuid,
  status text,
  is_installment boolean,
  total_installments integer,
  installment_number integer,
  billing_month date,
  due_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.virtual_id,
    v.transaction_id,
    v.household_id,
    v.type,
    v.description,
    v.amount,
    v.transaction_date,
    v.category_id,
    v.account_id,
    v.credit_card_id,
    v.status,
    v.is_installment,
    v.total_installments,
    v.installment_number,
    v.billing_month,
    v.due_date
  FROM transactions_with_installments_expanded v
  WHERE v.household_id = p_household_id
    AND EXTRACT(YEAR FROM v.transaction_date) = p_year
    AND EXTRACT(MONTH FROM v.transaction_date) = p_month
  ORDER BY v.transaction_date DESC, v.description;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_monthly_transactions(uuid, integer, integer) TO authenticated;

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
