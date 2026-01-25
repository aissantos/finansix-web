-- ============================================================================
-- Migration: Allow Negative Amounts and Fix Transfer Types
-- Date: 2026-01-25
-- Purpose: 1. Drop constraints that prevent negative amounts (needed for signed transfers).
--          2. Fix existing "Transferência" transactions to use 'transfer' type and signed values.
-- ============================================================================

-- 1. Drop constraints ensuring positive amounts
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_positive_amount;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;

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
    AND description ILIKE 'Transferência:%'
    AND deleted_at IS NULL;

  -- Fix Incoming Transfers (Income -> Transfer, ensure positive)
  UPDATE transactions
  SET 
    type = 'transfer',
    amount = ABS(amount),
    amount_cents = ABS(amount_cents)
  WHERE 
    type = 'income' 
    AND description ILIKE 'Transferência:%'
    AND deleted_at IS NULL;

END $$;
