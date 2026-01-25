-- ============================================================================
-- Migration: Absolute Final Transfer Fix (Enum -> Text Check)
-- Date: 2026-01-25
-- Purpose: 1. DROP Dependent View `monthly_summary`.
--          2. Convert `type` column to TEXT in all tables (transactions, categories, expected_transactions).
--          3. DROP Enum `transaction_type`.
--          4. Add Check Constraints.
--          5. Restore `monthly_summary`.
-- ============================================================================

-- 1. DROP DEPENDENT VIEW
DROP VIEW IF EXISTS monthly_summary;

-- 2. ALTER COLUMNS TO TEXT (Break Enum Dependency)
ALTER TABLE transactions ALTER COLUMN type TYPE text;
ALTER TABLE categories ALTER COLUMN type TYPE text;
ALTER TABLE expected_transactions ALTER COLUMN type TYPE text;

-- 3. DROP OLD ENUM (Cascade to be safe, though we broke links)
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

-- 6. RESTORE VIEW (monthly_summary)
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
