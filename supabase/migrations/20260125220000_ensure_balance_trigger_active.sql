-- ============================================================================
-- Migration: Ensure Balance Update Trigger is Active
-- Date: 2026-01-25
-- Purpose: Recreate the balance update trigger to ensure it fires on INSERT/UPDATE/DELETE
--          Tests showed the trigger exists but doesn't execute - recreating it.
-- ============================================================================

-- 1. DROP AND RECREATE THE TRIGGER FUNCTION (ensure it's up to date)
CREATE OR REPLACE FUNCTION public.trigger_update_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Creating or restoring a transaction
  IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NULL) THEN
    IF NEW.account_id IS NOT NULL THEN
      PERFORM public.update_account_balance(NEW.account_id);
    END IF;
  END IF;

  -- Deleting or soft-deleting a transaction
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL) THEN
    IF OLD.account_id IS NOT NULL THEN
      PERFORM public.update_account_balance(OLD.account_id);
    END IF;
  END IF;

  -- Handle account change (move transaction from one account to another)
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.account_id IS NOT NULL AND NEW.account_id IS NOT NULL AND OLD.account_id != NEW.account_id THEN
      PERFORM public.update_account_balance(OLD.account_id);
      PERFORM public.update_account_balance(NEW.account_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- 2. DROP AND RECREATE THE TRIGGER
DROP TRIGGER IF EXISTS tr_update_account_balance ON transactions;

CREATE TRIGGER tr_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_account_balance();

-- 3. VERIFY THE update_account_balance FUNCTION EXISTS AND IS CORRECT
-- (This should already exist from 20260124190000_fix_account_balance_trigger.sql)
-- But let's ensure it's using the correct logic

CREATE OR REPLACE FUNCTION public.update_account_balance(p_account_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_initial_balance DECIMAL(15,2);
  v_initial_balance_cents BIGINT;
  v_total_income_cents BIGINT;
  v_total_expense_cents BIGINT;
  v_total_transfer_cents BIGINT;
  v_new_balance_cents BIGINT;
BEGIN
  -- Get initial balance
  SELECT 
    COALESCE(initial_balance, 0),
    COALESCE(initial_balance * 100, 0)
  INTO v_initial_balance, v_initial_balance_cents
  FROM accounts
  WHERE id = p_account_id;

  -- Calculate total income (in cents)
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_total_income_cents
  FROM transactions
  WHERE account_id = p_account_id
    AND type = 'income'
    AND status = 'completed'
    AND deleted_at IS NULL;

  -- Calculate total expense (in cents)
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_total_expense_cents
  FROM transactions
  WHERE account_id = p_account_id
    AND type = 'expense'
    AND status = 'completed'
    AND deleted_at IS NULL;

  -- Calculate total transfers (in cents) - ALREADY SIGNED (negative=outgoing, positive=incoming)
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO v_total_transfer_cents
  FROM transactions
  WHERE account_id = p_account_id
    AND type = 'transfer'
    AND status = 'completed'
    AND deleted_at IS NULL;

  -- Calculate new balance
  v_new_balance_cents := v_initial_balance_cents + v_total_income_cents - v_total_expense_cents + v_total_transfer_cents;

  -- Update account
  UPDATE accounts
  SET 
    current_balance = v_new_balance_cents / 100.0,
    current_balance_cents = v_new_balance_cents,
    updated_at = NOW()
  WHERE id = p_account_id;
END;
$$;

-- 4. RECALCULATE ALL BALANCES NOW
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM accounts WHERE deleted_at IS NULL LOOP
    PERFORM public.update_account_balance(r.id);
  END LOOP;
END;
$$;
