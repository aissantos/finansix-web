-- Migration: Installment Explosion Trigger
-- This trigger automatically creates installment records when a transaction
-- is marked as installment. The frontend only sends amount and total_installments,
-- and the database handles the explosion logic.

-- ============================================================================
-- 1. Function to explode installments
-- ============================================================================
CREATE OR REPLACE FUNCTION explode_installments()
RETURNS TRIGGER AS $$
DECLARE
  installment_amount DECIMAL(12,2);
  billing_date DATE;
  due_date DATE;
  card_closing_day INT;
  card_due_day INT;
  i INT;
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

  -- Create installment records
  FOR i IN 1..NEW.total_installments LOOP
    -- Calculate billing month based on purchase date and closing day
    -- If purchase is before closing day, it goes to current month's bill
    -- Otherwise, it goes to next month's bill
    IF EXTRACT(DAY FROM NEW.transaction_date) <= card_closing_day THEN
      billing_date := DATE_TRUNC('month', NEW.transaction_date) + (i - 1) * INTERVAL '1 month';
    ELSE
      billing_date := DATE_TRUNC('month', NEW.transaction_date) + i * INTERVAL '1 month';
    END IF;

    -- Calculate due date (billing month + due_day)
    due_date := billing_date + (card_due_day - 1) * INTERVAL '1 day';

    -- Insert installment
    INSERT INTO installments (
      transaction_id,
      household_id,
      credit_card_id,
      installment_number,
      total_installments,
      amount,
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
      billing_date,
      due_date,
      'pending',
      NOW(),
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Trigger on transactions table
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_explode_installments ON transactions;

CREATE TRIGGER trigger_explode_installments
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.is_installment = TRUE AND NEW.total_installments > 1)
  EXECUTE FUNCTION explode_installments();

-- ============================================================================
-- 3. Function to handle installment deletion (cascade soft delete)
-- ============================================================================
CREATE OR REPLACE FUNCTION cascade_delete_installments()
RETURNS TRIGGER AS $$
BEGIN
  -- When a transaction is soft-deleted, also soft-delete its installments
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE installments
    SET deleted_at = NEW.deleted_at, updated_at = NOW()
    WHERE transaction_id = NEW.id AND deleted_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_cascade_delete_installments ON transactions;

CREATE TRIGGER trigger_cascade_delete_installments
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION cascade_delete_installments();

-- ============================================================================
-- 4. Function to recalculate installments when transaction is updated
-- ============================================================================
CREATE OR REPLACE FUNCTION recalculate_installments()
RETURNS TRIGGER AS $$
DECLARE
  installment_amount DECIMAL(12,2);
BEGIN
  -- Only recalculate if amount changed and transaction has installments
  IF OLD.amount != NEW.amount AND NEW.is_installment = TRUE THEN
    installment_amount := ROUND(NEW.amount / NEW.total_installments, 2);
    
    UPDATE installments
    SET amount = installment_amount, updated_at = NOW()
    WHERE transaction_id = NEW.id 
      AND deleted_at IS NULL
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_recalculate_installments ON transactions;

CREATE TRIGGER trigger_recalculate_installments
  AFTER UPDATE ON transactions
  FOR EACH ROW
  WHEN (OLD.amount != NEW.amount AND NEW.is_installment = TRUE)
  EXECUTE FUNCTION recalculate_installments();

-- ============================================================================
-- 5. Add deleted_at column to installments if not exists
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'installments' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE installments ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- ============================================================================
-- 6. Index for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_installments_transaction_id ON installments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_installments_billing_month ON installments(billing_month);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_household_pending 
  ON installments(household_id, status) 
  WHERE status = 'pending' AND deleted_at IS NULL;

-- ============================================================================
-- 7. Comment for documentation
-- ============================================================================
COMMENT ON FUNCTION explode_installments() IS 
'Automatically creates installment records when a transaction is marked as installment.
This ensures consistency whether transactions come from the web app, mobile, CSV import, or API.';
