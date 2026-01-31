-- Migration to ensure ALL credit card transactions create an 'installment' record (bill item)
-- This fixes the issue where single-payment purchases don't show up in the Card Detail view.

-- 1. Update the function to handle single installments
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
  total_inst INT;
BEGIN
  -- Only process credit card transactions
  IF NEW.credit_card_id IS NULL THEN
    RETURN NEW; -- Not a credit card transaction, nothing to do
  END IF;

  -- Determine total installments (default to 1)
  total_inst := 1;
  IF NEW.total_installments IS NOT NULL AND NEW.total_installments > 0 THEN
    total_inst := NEW.total_installments;
  END IF;

  -- Get credit card billing info
  SELECT closing_day, due_day INTO card_closing_day, card_due_day
  FROM credit_cards
  WHERE id = NEW.credit_card_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit card not found';
  END IF;

  -- Calculate installment amount
  installment_amount := ROUND(NEW.amount / total_inst, 2);
  installment_amount_cents := ROUND((NEW.amount * 100) / total_inst);

  -- Get current month start
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);

  -- Create installment records
  FOR i IN 1..total_inst LOOP
    -- Calculate billing month
    IF EXTRACT(DAY FROM NEW.transaction_date) <= card_closing_day THEN
      billing_date := DATE_TRUNC('month', NEW.transaction_date) + (i - 1) * INTERVAL '1 month';
    ELSE
      billing_date := DATE_TRUNC('month', NEW.transaction_date) + i * INTERVAL '1 month';
    END IF;

    -- Calculate due date using standard integer multiplication
    due_date := billing_date + ((card_due_day - 1) * INTERVAL '1 day');

    -- Determine status based on billing month
    IF billing_date < current_month_start THEN
      installment_status := 'paid';
    ELSE
      installment_status := 'pending';
    END IF;
    
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
      total_inst,
      installment_amount,
      installment_amount_cents,
      billing_date,
      due_date,
      installment_status,
      NOW(),
      NOW()
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop old trigger and recreate with wider scope
DROP TRIGGER IF EXISTS trigger_explode_installments ON transactions;

CREATE TRIGGER trigger_explode_installments
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.credit_card_id IS NOT NULL) -- Run for ALL credit card transactions
  EXECUTE FUNCTION explode_installments();
