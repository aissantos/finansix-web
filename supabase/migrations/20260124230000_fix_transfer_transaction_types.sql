-- ============================================================================
-- Migration: Fix Transfer Transaction Types
-- Date: 2026-01-24
-- Purpose: Convert existing "Transferência" transactions from Expense/Income to Transfer type
--          to ensure they don't inflate expense reports.
-- ============================================================================

-- Function to safely migrate data
DO $$
BEGIN
  -- 1. Fix Outgoing Transfers (stored as Expenses)
  -- They are currently positive amounts with type='expense'.
  -- We need to change type to 'transfer' and amount to negative.
  UPDATE transactions
  SET 
    type = 'transfer', 
    amount = -ABS(amount),
    amount_cents = -ABS(amount_cents)
  WHERE 
    type = 'expense' 
    AND description LIKE 'Transferência:%'
    AND deleted_at IS NULL;

  -- 2. Fix Incoming Transfers (stored as Incomes)
  -- They are currently positive amounts with type='income'.
  -- We need to change type to 'transfer' (amount remains positive).
  UPDATE transactions
  SET 
    type = 'transfer'
  WHERE 
    type = 'income' 
    AND description LIKE 'Transferência:%'
    AND deleted_at IS NULL;

END $$;
