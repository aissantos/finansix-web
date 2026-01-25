-- ============================================================================
-- Migration: Fix Transfer Trigger Logic
-- Date: 2026-01-25
-- Purpose: Remove amount sign manipulation from trigger.
--          The frontend already sends correct signs (-amount for source, +amount for dest).
--          Trigger should only ensure type='transfer', not modify amounts.
-- ============================================================================

-- Replace the trigger function with a simplified version
CREATE OR REPLACE FUNCTION public.fix_transfer_record_robust()
RETURNS TRIGGER AS $$
BEGIN
  -- Only ensure that transfers have the correct type
  -- Do NOT modify the amount - the frontend sends it with the correct sign
  IF NEW.description ILIKE '%Transferência%' THEN
    NEW.type := 'transfer';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger remains the same
DROP TRIGGER IF EXISTS tr_robust_transfer_fix ON transactions;
CREATE TRIGGER tr_robust_transfer_fix
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fix_transfer_record_robust();
