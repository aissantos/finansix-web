-- ============================================================================
-- Migration: DEFINITIVE Transfer Fix - Amount Cents Auto-Population
-- Date: 2026-01-25
-- Purpose: COMPLETE FIX for transfer system
--          1. Remove positive-only constraint on amount_cents (blocks negative transfers)
--          2. Add trigger to auto-populate amount_cents from amount
--          3. Ensure balance calculation works correctly
-- ============================================================================

-- 1. REMOVE POSITIVE-ONLY CONSTRAINT (Critical for transfers!)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_cents_positive;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_cents_check;

-- 2. CREATE TRIGGER TO AUTO-POPULATE amount_cents FROM amount
CREATE OR REPLACE FUNCTION public.sync_amount_cents()
RETURNS TRIGGER AS $$
BEGIN
  -- Always sync amount_cents from amount (preserving sign!)
  NEW.amount_cents := ROUND(NEW.amount * 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_amount_cents ON transactions;
CREATE TRIGGER tr_sync_amount_cents
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_amount_cents();

-- 3. BACKFILL EXISTING TRANSACTIONS (in case any are missing)
UPDATE transactions
SET amount_cents = ROUND(amount * 100)
WHERE amount_cents IS NULL OR amount_cents = 0;

-- 4. ENSURE BALANCE TRIGGER USES CORRECT LOGIC
-- The existing update_account_balance function already uses amount_cents correctly
-- It sums transfers with their signs preserved (line 48-54 in fix_account_balance_trigger.sql)

-- 5. RECALCULATE ALL BALANCES
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM accounts WHERE deleted_at IS NULL LOOP
    PERFORM public.update_account_balance(r.id);
  END LOOP;
END;
$$;
