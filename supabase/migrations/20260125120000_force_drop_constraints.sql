-- ============================================================================
-- Migration: FORCE DROP Constraints and Fix Transfers
-- Date: 2026-01-25
-- Purpose: 1. Aggressively drop strict amount constraints.
--          2. Convert "Expense/Income" transfers to "Transfer" type with correct signs.
-- ============================================================================

-- 1. Drop constraints ensuring positive amounts (try all variations)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_positive_amount;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_cents_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS checks_amount_positive;

-- 2. Fix Transfer Data
DO $$
BEGIN
  -- Fix Outgoing Transfers (Expense -> Transfer, make negative)
  UPDATE transactions
  SET 
    type = 'transfer', 
    amount = -ABS(amount),
    amount_cents = -ABS(amount_cents)
  WHERE 
    type = 'expense' 
    AND description ILIKE '%Transferência%'
    AND deleted_at IS NULL;

  -- Fix Incoming Transfers (Income -> Transfer, ensure positive)
  UPDATE transactions
  SET 
    type = 'transfer',
    amount = ABS(amount),
    amount_cents = ABS(amount_cents)
  WHERE 
    type = 'income' 
    AND description ILIKE '%Transferência%'
    AND deleted_at IS NULL;

END $$;
