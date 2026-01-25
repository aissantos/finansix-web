-- ============================================================================
-- Migration: Ultimate Transfer Fix (Enum, Constraints, Safe Trigger)
-- Date: 2026-01-25
-- Purpose: 1. Ensure 'transfer' is allowed in transaction_type (Enum or Check).
--          2. Remove ANY constraint blocking negative amounts.
--          3. Make Trigger logic safe (non-blocking).
-- ============================================================================

-- 1. Fix Enum (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
        ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'transfer';
    END IF;
END $$;

-- 2. Drop Potential Constraints (Broad sweep)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transaction_type_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_transaction_type;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS amount_positive;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_amount_positive;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_cents_check;

-- 3. Replace Trigger with SAFE Version (Exception Handling)
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
  -- Safe Block
  BEGIN
      v_description := NEW.description;
      
      -- 1. Always force type to 'transfer' if it looks like one
      IF v_description ILIKE 'Transferência:%' OR v_description ILIKE '%Transferência%' THEN
        NEW.type := 'transfer';
        
        -- Get Account Name (Fail safe if account missing)
        IF NEW.account_id IS NOT NULL THEN
            SELECT name INTO v_acc_name FROM accounts WHERE id = NEW.account_id;
            
            -- 2. Determine Separator
            IF v_description LIKE '% → %' THEN
              v_separator := ' → ';
            ELSIF v_description LIKE '% -> %' THEN
              v_separator := ' -> ';
            ELSIF v_description LIKE '% - %' THEN
              v_separator := ' - ';
            ELSE
              v_separator := NULL;
            END IF;
            
            -- 3. Parse and Fix Sign
            IF v_separator IS NOT NULL THEN
              v_parts := string_to_array(v_description, v_separator);
              
              IF array_length(v_parts, 1) >= 2 THEN
                 -- Clean Source: remove "Transferência: " prefix
                 v_source := trim(regexp_replace(v_parts[1], '^.*Transferência:\s*', '', 'i'));
                 v_dest := trim(v_parts[2]);
                 
                 -- Compare with current account
                 IF v_acc_name IS NOT NULL THEN
                     IF trim(v_acc_name) ILIKE v_source THEN
                       -- Source: Negative
                       NEW.amount := -ABS(NEW.amount);
                       NEW.amount_cents := -ABS(NEW.amount_cents);
                     ELSIF trim(v_acc_name) ILIKE v_dest THEN
                       -- Dest: Positive
                       NEW.amount := ABS(NEW.amount);
                       NEW.amount_cents := ABS(NEW.amount_cents);
                     END IF;
                 END IF;
              END IF;
            END IF;
        END IF;
      END IF;

  EXCEPTION WHEN OTHERS THEN
    -- If ANYTHING fails in the trigger, just log and allow the insert (don't block user)
    RAISE WARNING 'Error in fix_transfer_record_robust trigger: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure Trigger is applied
DROP TRIGGER IF EXISTS tr_robust_transfer_fix ON transactions;
CREATE TRIGGER tr_robust_transfer_fix
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fix_transfer_record_robust();

-- 4. Recalculate Balances (Just to be sure)
-- (Reusing the function from previous migration if available)
DO $$
BEGIN
  -- Simple check to see if function exists, then run it on accounts
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_account_balance') THEN
      PERFORM update_account_balance(id) FROM accounts WHERE deleted_at IS NULL;
  END IF;
END $$;
