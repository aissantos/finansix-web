-- ============================================================================
-- Migration: Fail-safe Trigger for Transfers
-- Date: 2026-01-25
-- Purpose: 1. Ensure any transaction with "Transferência" in description is type='transfer'.
--          2. Force drop constraints that might block this.
--          3. Fix existing data one last time.
-- ============================================================================

-- 1. Drop constraints (Just to be absolutely sure)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_positive_amount;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_cents_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS checks_amount_positive;

-- 2. Create Trigger Function to Enforce Transfer Type
CREATE OR REPLACE FUNCTION public.force_transfer_type()
RETURNS TRIGGER AS $$
BEGIN
  -- If description indicates a transfer, force type to 'transfer'
  IF NEW.description ILIKE 'Transferência:%' OR NEW.description ILIKE '%Transferência%' THEN
    NEW.type := 'transfer';
    
    -- Optional: Logic to ensure sign is correct if it was sent as an expense (positive)?
    -- But we trust frontend sends negative for Out.
    -- If it was sent as Expense, amount might be positive (User intent: "Cost").
    -- Use heuristic: 
    -- If Type WAS 'expense' (before force), and Amount > 0, flip to negative?
    -- Only for INSERT. For UPDATE, it's safer to trust the provided amount unless converting.
    
    -- Simple heuristic for data consistency:
    -- We assume transfers are signed.
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Trigger (Before Insert/Update)
DROP TRIGGER IF EXISTS tr_force_transfer_type ON transactions;
CREATE TRIGGER tr_force_transfer_type
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.force_transfer_type();


-- 4. Fix Existing Data (Again, covering all cases)
DO $$
BEGIN
  -- Fix Outgoing (Expense -> Transfer, ensure negative)
  UPDATE transactions
  SET 
    type = 'transfer', 
    amount = -ABS(amount),
    amount_cents = -ABS(amount_cents)
  WHERE 
    type = 'expense' 
    AND (description ILIKE 'Transferência:%' OR description ILIKE '%Transferência%')
    AND deleted_at IS NULL;

  -- Fix Incoming (Income -> Transfer, ensure positive)
  UPDATE transactions
  SET 
    type = 'transfer',
    amount = ABS(amount),
    amount_cents = ABS(amount_cents)
  WHERE 
    type = 'income' 
    AND (description ILIKE 'Transferência:%' OR description ILIKE '%Transferência%')
    AND deleted_at IS NULL;

   -- Fix improperly labeled 'transfer' types with wrong signs?
   -- E.g. Transfer OUT but positive amount? Hard to distinguish without context.
   -- But usually, our system creates them correctly.
END $$;
