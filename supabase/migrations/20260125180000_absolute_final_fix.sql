-- ============================================================================
-- Migration: Absolute Final Transfer Fix (Enum -> Text Check)
-- Date: 2026-01-25
-- Purpose: 1. Convert `type` column to TEXT to remove strict Enum limits.
--          2. Add flexible Check Constraint allowing 'transfer'.
--          3. Ensure no negative amount constraints exist.
-- ============================================================================

-- 1. Convert 'type' to text to break Enum dependency
ALTER TABLE transactions 
  ALTER COLUMN type TYPE text;

-- 2. Drop the old Enum type if it exists (cleanup)
DROP TYPE IF EXISTS transaction_type CASCADE;

-- 3. Add Check Constraint (Flexible Schema)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_transaction_type;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transaction_type_check;

ALTER TABLE transactions 
  ADD CONSTRAINT check_transaction_type 
  CHECK (type IN ('income', 'expense', 'transfer'));

-- 4. Drop potentially blocking Amount constraints
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_positive_amount;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS amount_positive;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;

-- 5. Re-apply Safe Trigger (as defined previously) just to be sure it's linked
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

-- 6. Recalculate everything
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_account_balance') THEN
      PERFORM update_account_balance(id) FROM accounts WHERE deleted_at IS NULL;
  END IF;
END $$;
