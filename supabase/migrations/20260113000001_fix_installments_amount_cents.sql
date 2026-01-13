-- Fix: Add amount_cents to explode_installments trigger
-- This fixes the "null value in column amount_cents" error when creating installment transactions

CREATE OR REPLACE FUNCTION explode_installments()
RETURNS TRIGGER AS $$
DECLARE
  card credit_cards%ROWTYPE;
  purchase_date DATE;
  installment_amount NUMERIC;
  installment_amount_cents BIGINT;
  billing_month DATE;
  due_date DATE;
  closing_day INT;
  due_day INT;
  i INT;
BEGIN
  -- Skip if not an installment transaction
  IF NOT NEW.is_installment OR NEW.total_installments <= 1 OR NEW.credit_card_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get credit card details
  SELECT * INTO card FROM credit_cards WHERE id = NEW.credit_card_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit card not found: %', NEW.credit_card_id;
  END IF;

  closing_day := card.closing_day;
  due_day := card.due_day;
  purchase_date := NEW.transaction_date;
  
  -- Calculate installment amounts (both decimal and cents)
  installment_amount := ROUND(NEW.amount / NEW.total_installments, 2);
  installment_amount_cents := NEW.amount_cents / NEW.total_installments;

  -- Generate installments
  FOR i IN 0..(NEW.total_installments - 1) LOOP
    -- Calculate billing month
    IF EXTRACT(DAY FROM purchase_date) >= closing_day THEN
      billing_month := DATE_TRUNC('month', purchase_date) + INTERVAL '1 month';
    ELSE
      billing_month := DATE_TRUNC('month', purchase_date);
    END IF;
    billing_month := billing_month + (i * INTERVAL '1 month');

    -- Calculate due date
    IF due_day >= closing_day THEN
      due_date := billing_month + ((due_day - 1) * INTERVAL '1 day');
    ELSE
      due_date := billing_month + INTERVAL '1 month' + ((due_day - 1) * INTERVAL '1 day');
    END IF;

    -- Insert installment WITH amount_cents
    INSERT INTO installments (
      household_id,
      transaction_id,
      credit_card_id,
      installment_number,
      total_installments,
      amount,
      amount_cents,
      billing_month,
      due_date,
      status
    ) VALUES (
      NEW.household_id,
      NEW.id,
      NEW.credit_card_id,
      i + 1,
      NEW.total_installments,
      installment_amount,
      installment_amount_cents,
      billing_month,
      due_date,
      'pending'
    );
  END LOOP;

  -- Update transaction with first installment info
  NEW.installment_number := 1;
  NEW.billing_month := DATE_TRUNC('month', 
    CASE 
      WHEN EXTRACT(DAY FROM purchase_date) >= closing_day 
      THEN purchase_date + INTERVAL '1 month'
      ELSE purchase_date
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trigger_explode_installments ON transactions;
CREATE TRIGGER trigger_explode_installments
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.is_installment = true AND NEW.total_installments > 1 AND NEW.credit_card_id IS NOT NULL)
  EXECUTE FUNCTION explode_installments();
