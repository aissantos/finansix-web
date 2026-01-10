-- ============================================================================
-- Migration: Fix Retroactive Installments
-- Version: 1.5.4.7
-- Date: 10/01/2026
-- Critical: Marca parcelas retroativas como pagas automaticamente
-- ============================================================================

-- ============================================================================
-- 1. UPDATE TRIGGER: Mark past installments as paid
-- ============================================================================

CREATE OR REPLACE FUNCTION explode_installments()
RETURNS TRIGGER AS $$
DECLARE
  installment_amount DECIMAL(12,2);
  installment_amount_cents BIGINT;
  billing_date DATE;
  due_date DATE;
  card_closing_day INT;
  card_due_day INT;
  i INT;
  installment_status VARCHAR(20);
  current_month_start DATE;
BEGIN
  -- Only process if this is an installment transaction
  IF NEW.is_installment = FALSE OR NEW.total_installments <= 1 THEN
    RETURN NEW;
  END IF;

  -- Only process credit card transactions
  IF NEW.credit_card_id IS NULL THEN
    RAISE EXCEPTION 'Installment transactions require a credit card';
  END IF;

  -- Get credit card billing info
  SELECT closing_day, due_day INTO card_closing_day, card_due_day
  FROM credit_cards
  WHERE id = NEW.credit_card_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit card not found';
  END IF;

  -- Calculate installment amount (total / number of installments)
  installment_amount := ROUND(NEW.amount / NEW.total_installments, 2);
  installment_amount_cents := ROUND((NEW.amount * 100) / NEW.total_installments);

  -- Get current month start (for comparison)
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);

  -- Create installment records
  FOR i IN 1..NEW.total_installments LOOP
    -- Calculate billing month based on purchase date and closing day
    IF EXTRACT(DAY FROM NEW.transaction_date) <= card_closing_day THEN
      billing_date := DATE_TRUNC('month', NEW.transaction_date) + (i - 1) * INTERVAL '1 month';
    ELSE
      billing_date := DATE_TRUNC('month', NEW.transaction_date) + i * INTERVAL '1 month';
    END IF;

    -- Calculate due date (billing month + due_day)
    due_date := billing_date + (card_due_day - 1) * INTERVAL '1 day';

    -- ✅ CRITICAL FIX: Determine status based on billing month
    -- If billing_date is before current month, mark as 'paid'
    -- Otherwise, mark as 'pending'
    IF billing_date < current_month_start THEN
      installment_status := 'paid';
    ELSE
      installment_status := 'pending';
    END IF;

    -- Insert installment
    INSERT INTO installments (
      transaction_id,
      household_id,
      credit_card_id,
      installment_number,
      total_installments,
      amount,
      amount_cents,
      billing_month,
      due_date,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.household_id,
      NEW.credit_card_id,
      i,
      NEW.total_installments,
      installment_amount,
      installment_amount_cents,
      billing_date,
      due_date,
      installment_status,  -- ✅ Status dinâmico
      NOW(),
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. UPDATE EXISTING RETROACTIVE INSTALLMENTS
-- ============================================================================

-- Mark all installments with billing_month < current month as 'paid'
UPDATE installments
SET 
  status = 'paid',
  updated_at = NOW()
WHERE 
  billing_month < DATE_TRUNC('month', CURRENT_DATE)
  AND status = 'pending'
  AND deleted_at IS NULL;

-- ============================================================================
-- 3. ADD COMMENT
-- ============================================================================

COMMENT ON FUNCTION explode_installments() IS 
'Automatically creates installment records when a transaction is marked as installment.
CRITICAL: Marks installments with billing_month < current month as PAID automatically.
This ensures retroactive transactions have correct status.';

-- ============================================================================
-- 4. VERIFICATION QUERY
-- ============================================================================

-- Para verificar parcelas retroativas marcadas como pagas:
-- SELECT 
--   i.id,
--   t.description,
--   i.installment_number,
--   i.billing_month,
--   i.status,
--   CASE 
--     WHEN i.billing_month < DATE_TRUNC('month', CURRENT_DATE) THEN 'Should be PAID'
--     ELSE 'Should be PENDING'
--   END as expected_status
-- FROM installments i
-- JOIN transactions t ON t.id = i.transaction_id
-- WHERE i.deleted_at IS NULL
-- ORDER BY i.billing_month DESC;
