-- Migration: Atomic Transaction Creation
-- Creates RPC function for creating transactions with installments atomically
-- This prevents orphan records when one operation fails

-- ============================================================================
-- Function: create_transaction_with_installments
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_transaction_with_installments(
  p_transaction JSONB,
  p_generate_installments BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_household_id UUID;
  v_credit_card_id UUID;
  v_amount DECIMAL(15,2);
  v_total_installments INT;
  v_installment_amount DECIMAL(15,2);
  v_due_date DATE;
  v_closing_day INT;
  v_due_day INT;
  i INT;
BEGIN
  -- Extract transaction data
  v_household_id := (p_transaction->>'household_id')::UUID;
  v_credit_card_id := (p_transaction->>'credit_card_id')::UUID;
  v_amount := (p_transaction->>'amount')::DECIMAL(15,2);
  v_total_installments := COALESCE((p_transaction->>'total_installments')::INT, 1);
  
  -- Validate household access
  IF v_household_id != _secured.user_household_id() THEN
    RAISE EXCEPTION 'Access denied to household';
  END IF;
  
  -- Insert transaction
  INSERT INTO transactions (
    household_id,
    account_id,
    credit_card_id,
    category_id,
    type,
    status,
    amount,
    description,
    notes,
    transaction_date,
    is_installment,
    total_installments,
    is_reimbursable,
    reimbursement_source
  )
  VALUES (
    v_household_id,
    (p_transaction->>'account_id')::UUID,
    v_credit_card_id,
    (p_transaction->>'category_id')::UUID,
    (p_transaction->>'type')::transaction_type,
    COALESCE((p_transaction->>'status')::transaction_status, 'completed'),
    v_amount,
    p_transaction->>'description',
    p_transaction->>'notes',
    COALESCE((p_transaction->>'transaction_date')::DATE, CURRENT_DATE),
    COALESCE((p_transaction->>'is_installment')::BOOLEAN, v_total_installments > 1),
    v_total_installments,
    COALESCE((p_transaction->>'is_reimbursable')::BOOLEAN, FALSE),
    p_transaction->>'reimbursement_source'
  )
  RETURNING id INTO v_transaction_id;
  
  -- Generate installments if requested and credit card is provided
  IF p_generate_installments AND v_credit_card_id IS NOT NULL AND v_total_installments > 1 THEN
    -- Get card billing info
    SELECT closing_day, due_day
    INTO v_closing_day, v_due_day
    FROM credit_cards
    WHERE id = v_credit_card_id;
    
    -- Calculate installment amount
    v_installment_amount := ROUND(v_amount / v_total_installments, 2);
    
    -- Calculate first due date based on card closing/due days
    v_due_date := DATE_TRUNC('month', CURRENT_DATE) + (v_due_day || ' days')::INTERVAL;
    IF EXTRACT(DAY FROM CURRENT_DATE) > v_closing_day THEN
      v_due_date := v_due_date + INTERVAL '1 month';
    END IF;
    
    -- Create installments
    FOR i IN 1..v_total_installments LOOP
      INSERT INTO installments (
        household_id,
        transaction_id,
        credit_card_id,
        installment_number,
        total_installments,
        amount,
        due_date,
        status
      )
      VALUES (
        v_household_id,
        v_transaction_id,
        v_credit_card_id,
        i,
        v_total_installments,
        CASE 
          WHEN i = v_total_installments THEN v_amount - (v_installment_amount * (v_total_installments - 1))
          ELSE v_installment_amount
        END,
        v_due_date + ((i - 1) || ' months')::INTERVAL,
        'pending'
      );
    END LOOP;
  END IF;
  
  RETURN v_transaction_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RAISE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_transaction_with_installments(JSONB, BOOLEAN) TO authenticated;

-- ============================================================================
-- Function: delete_transaction_cascade
-- Soft deletes transaction and all related installments
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_transaction_cascade(p_transaction_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Get household_id and verify access
  SELECT household_id INTO v_household_id
  FROM transactions
  WHERE id = p_transaction_id AND deleted_at IS NULL;
  
  IF v_household_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  
  IF v_household_id != _secured.user_household_id() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Soft delete installments
  UPDATE installments
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE transaction_id = p_transaction_id AND deleted_at IS NULL;
  
  -- Soft delete transaction
  UPDATE transactions
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_transaction_id;
  
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_transaction_cascade(UUID) TO authenticated;

-- ============================================================================
-- Add composite indexes for common queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_household_date_type 
  ON transactions(household_id, transaction_date DESC, type) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_installments_card_due_status 
  ON installments(credit_card_id, due_date, status) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_installments_household_status 
  ON installments(household_id, status, due_date) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- Add database constraints
-- ============================================================================

ALTER TABLE transactions 
  DROP CONSTRAINT IF EXISTS check_positive_amount;
  
ALTER TABLE transactions 
  ADD CONSTRAINT check_positive_amount CHECK (amount > 0);

ALTER TABLE installments 
  DROP CONSTRAINT IF EXISTS check_installment_number;
  
ALTER TABLE installments 
  ADD CONSTRAINT check_installment_number 
  CHECK (installment_number > 0 AND installment_number <= total_installments);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION public.create_transaction_with_installments IS 
'Creates a transaction with optional installment generation in a single atomic operation.
Parameters:
- p_transaction: JSON with transaction fields
- p_generate_installments: If true and credit_card_id provided, generates installment records
Returns: The created transaction ID
Rolls back completely if any step fails.';

COMMENT ON FUNCTION public.delete_transaction_cascade IS 
'Soft deletes a transaction and all related installments.
Verifies household access before deletion.
Returns TRUE on success.';
