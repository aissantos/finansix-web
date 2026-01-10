-- Migration: Bill Payment Status System
-- Version: 1.5.4.6
-- Description: Adds payment status tracking for bills and card invoices
-- Date: 2026-01-10
-- FIX: Handles existing tables and ENUM types properly

-- ============================================================================
-- 1. Add payment_status to transactions table for regular bills
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'overdue', 'partial'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE transactions ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN paid_amount DECIMAL(12,2);
  END IF;
END $$;

-- ============================================================================
-- 2. Handle installments status ENUM - add new values if needed
-- ============================================================================
DO $$
BEGIN
  -- Add paid_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'installments' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE installments ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;

  -- Add paid_amount column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'installments' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE installments ADD COLUMN paid_amount DECIMAL(12,2);
  END IF;
END $$;

-- Add new ENUM values (these statements must be outside DO block)
-- They will silently fail if type doesn't exist or value already exists
ALTER TYPE installment_status ADD VALUE IF NOT EXISTS 'overdue';
ALTER TYPE installment_status ADD VALUE IF NOT EXISTS 'partial';
ALTER TYPE installment_status ADD VALUE IF NOT EXISTS 'cancelled';

-- ============================================================================
-- 3. Add missing columns to credit_card_statements if table exists
-- ============================================================================
DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_card_statements') THEN
    -- Add status column if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'credit_card_statements' AND column_name = 'status'
    ) THEN
      ALTER TABLE credit_card_statements 
      ADD COLUMN status TEXT NOT NULL DEFAULT 'open' 
      CHECK (status IN ('open', 'closed', 'paid', 'partial', 'overdue'));
    END IF;

    -- Add other missing columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'credit_card_statements' AND column_name = 'minimum_amount'
    ) THEN
      ALTER TABLE credit_card_statements ADD COLUMN minimum_amount DECIMAL(12,2);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'credit_card_statements' AND column_name = 'paid_amount'
    ) THEN
      ALTER TABLE credit_card_statements ADD COLUMN paid_amount DECIMAL(12,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'credit_card_statements' AND column_name = 'paid_at'
    ) THEN
      ALTER TABLE credit_card_statements ADD COLUMN paid_at TIMESTAMPTZ;
    END IF;
  ELSE
    -- Create table if it doesn't exist
    CREATE TABLE credit_card_statements (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
      billing_month DATE NOT NULL,
      closing_date DATE NOT NULL,
      due_date DATE NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      minimum_amount DECIMAL(12,2),
      paid_amount DECIMAL(12,2) DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid', 'partial', 'overdue')),
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(credit_card_id, billing_month)
    );
  END IF;
END $$;

-- ============================================================================
-- 4. Create indexes (only if column exists)
-- ============================================================================
DO $$
BEGIN
  -- Index on status column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_card_statements' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_statements_status ON credit_card_statements(status);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_statements_household ON credit_card_statements(household_id);
CREATE INDEX IF NOT EXISTS idx_statements_card_month ON credit_card_statements(credit_card_id, billing_month);

-- ============================================================================
-- 5. RLS Policies for credit_card_statements
-- ============================================================================
ALTER TABLE credit_card_statements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own statements" ON credit_card_statements;
CREATE POLICY "Users can view own statements"
  ON credit_card_statements FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own statements" ON credit_card_statements;
CREATE POLICY "Users can insert own statements"
  ON credit_card_statements FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own statements" ON credit_card_statements;
CREATE POLICY "Users can update own statements"
  ON credit_card_statements FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. Function to get payment summary for a household
-- ============================================================================
CREATE OR REPLACE FUNCTION get_payment_summary(p_household_id UUID)
RETURNS JSON AS $$
DECLARE
  v_pending DECIMAL(12,2) := 0;
  v_paid DECIMAL(12,2) := 0;
  v_overdue DECIMAL(12,2) := 0;
  v_partial_balance DECIMAL(12,2) := 0;
BEGIN
  -- Get pending bills (non-credit-card expenses)
  SELECT COALESCE(SUM(amount), 0) INTO v_pending
  FROM transactions
  WHERE household_id = p_household_id
    AND type = 'expense'
    AND credit_card_id IS NULL
    AND (payment_status IS NULL OR payment_status = 'pending')
    AND deleted_at IS NULL;

  -- Get paid bills this month
  SELECT COALESCE(SUM(COALESCE(paid_amount, amount)), 0) INTO v_paid
  FROM transactions
  WHERE household_id = p_household_id
    AND type = 'expense'
    AND credit_card_id IS NULL
    AND payment_status IN ('paid', 'partial')
    AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND deleted_at IS NULL;

  -- Get overdue bills
  SELECT COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0) INTO v_overdue
  FROM transactions
  WHERE household_id = p_household_id
    AND type = 'expense'
    AND credit_card_id IS NULL
    AND payment_status = 'overdue'
    AND deleted_at IS NULL;

  -- Get partial payment remaining balance
  SELECT COALESCE(SUM(amount - COALESCE(paid_amount, 0)), 0) INTO v_partial_balance
  FROM transactions
  WHERE household_id = p_household_id
    AND type = 'expense'
    AND payment_status = 'partial'
    AND deleted_at IS NULL;

  -- Add pending installments
  v_pending := v_pending + COALESCE((
    SELECT SUM(amount)
    FROM installments
    WHERE household_id = p_household_id
      AND status = 'pending'
      AND deleted_at IS NULL
  ), 0);

  -- Add overdue installments (check if status column supports 'overdue')
  BEGIN
    v_overdue := v_overdue + COALESCE((
      SELECT SUM(amount - COALESCE(paid_amount, 0))
      FROM installments
      WHERE household_id = p_household_id
        AND status = 'overdue'
        AND deleted_at IS NULL
    ), 0);
  EXCEPTION WHEN OTHERS THEN
    -- If 'overdue' status doesn't exist yet, skip
    NULL;
  END;

  RETURN json_build_object(
    'pending', v_pending,
    'paid', v_paid,
    'overdue', v_overdue,
    'partial_balance', v_partial_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Function to pay a bill (transaction)
-- ============================================================================
CREATE OR REPLACE FUNCTION pay_bill(
  p_transaction_id UUID,
  p_paid_amount DECIMAL(12,2),
  p_payment_type TEXT DEFAULT 'full'
)
RETURNS JSON AS $$
DECLARE
  v_transaction RECORD;
  v_new_status TEXT;
  v_total_paid DECIMAL(12,2);
BEGIN
  SELECT * INTO v_transaction
  FROM transactions
  WHERE id = p_transaction_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  v_total_paid := COALESCE(v_transaction.paid_amount, 0) + p_paid_amount;

  IF v_total_paid >= v_transaction.amount THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE transactions
  SET 
    payment_status = v_new_status,
    paid_amount = v_total_paid,
    paid_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE paid_at END,
    updated_at = NOW()
  WHERE id = p_transaction_id;

  RETURN json_build_object(
    'success', true, 
    'status', v_new_status,
    'paid_amount', v_total_paid,
    'remaining', v_transaction.amount - v_total_paid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Function to pay credit card invoice
-- ============================================================================
CREATE OR REPLACE FUNCTION pay_credit_card_invoice(
  p_card_id UUID,
  p_billing_month DATE,
  p_paid_amount DECIMAL(12,2),
  p_payment_type TEXT DEFAULT 'full'
)
RETURNS JSON AS $$
DECLARE
  v_statement RECORD;
  v_total_due DECIMAL(12,2);
  v_new_status TEXT;
  v_statement_id UUID;
  v_household_id UUID;
  v_card RECORD;
BEGIN
  SELECT * INTO v_card FROM credit_cards WHERE id = p_card_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Card not found');
  END IF;
  
  v_household_id := v_card.household_id;

  SELECT * INTO v_statement
  FROM credit_card_statements
  WHERE credit_card_id = p_card_id 
    AND billing_month = DATE_TRUNC('month', p_billing_month);

  IF NOT FOUND THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_due
    FROM installments
    WHERE credit_card_id = p_card_id
      AND billing_month = DATE_TRUNC('month', p_billing_month)
      AND status IN ('pending', 'overdue')
      AND deleted_at IS NULL;

    INSERT INTO credit_card_statements (
      household_id, credit_card_id, billing_month, closing_date, due_date,
      total_amount, minimum_amount, paid_amount, status
    ) VALUES (
      v_household_id, p_card_id,
      DATE_TRUNC('month', p_billing_month),
      DATE_TRUNC('month', p_billing_month) + (v_card.closing_day - 1) * INTERVAL '1 day',
      DATE_TRUNC('month', p_billing_month) + INTERVAL '1 month' + (v_card.due_day - 1) * INTERVAL '1 day',
      v_total_due, ROUND(v_total_due * 0.15, 2), 0, 'closed'
    )
    RETURNING * INTO v_statement;
  END IF;

  v_statement_id := v_statement.id;
  v_total_due := v_statement.total_amount - COALESCE(v_statement.paid_amount, 0);

  IF p_paid_amount >= v_total_due THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial';
  END IF;

  UPDATE credit_card_statements
  SET 
    status = v_new_status,
    paid_amount = COALESCE(paid_amount, 0) + p_paid_amount,
    paid_at = CASE WHEN v_new_status = 'paid' THEN NOW() ELSE paid_at END,
    updated_at = NOW()
  WHERE id = v_statement_id;

  IF v_new_status = 'paid' THEN
    UPDATE installments
    SET status = 'paid', paid_at = NOW(), paid_amount = amount, updated_at = NOW()
    WHERE credit_card_id = p_card_id
      AND billing_month = DATE_TRUNC('month', p_billing_month)
      AND status IN ('pending', 'overdue')
      AND deleted_at IS NULL;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'status', v_new_status,
    'paid_amount', COALESCE(v_statement.paid_amount, 0) + p_paid_amount,
    'remaining', GREATEST(0, v_total_due - p_paid_amount)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. Grant permissions
-- ============================================================================
GRANT ALL ON credit_card_statements TO authenticated;
GRANT EXECUTE ON FUNCTION pay_bill TO authenticated;
GRANT EXECUTE ON FUNCTION pay_credit_card_invoice TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_summary TO authenticated;

-- ============================================================================
-- 10. Comments
-- ============================================================================
COMMENT ON TABLE credit_card_statements IS 'Tracks credit card invoice/statement status including partial payments';
COMMENT ON FUNCTION get_payment_summary IS 'Returns aggregated payment status summary for dashboard display';