-- Migration to Fix Recurring Amount Logic
-- User feedback: Recurring expenses on Bank Accounts should REPEAT the input amount (e.g. 500/mo * 12) 
-- instead of dividing the input amount (not 500 total / 12).
-- Credit Cards remain as "Installments" (Division).

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
  IF NEW.is_installment = FALSE OR NEW.total_installments <= 1 THEN
    RETURN NEW;
  END IF;

  current_month_start := DATE_TRUNC('month', CURRENT_DATE);

  -- BRANCH 1: CREDIT CARD (Standard Installments - Division)
  IF NEW.credit_card_id IS NOT NULL THEN
      -- Calc Amount (Total / N)
      installment_amount := ROUND(NEW.amount / NEW.total_installments, 2);
      installment_amount_cents := ROUND((NEW.amount * 100) / NEW.total_installments);

      SELECT closing_day, due_day INTO card_closing_day, card_due_day
      FROM credit_cards
      WHERE id = NEW.credit_card_id;

      IF NOT FOUND THEN RAISE EXCEPTION 'Credit card not found'; END IF;

      FOR i IN 1..NEW.total_installments LOOP
        IF EXTRACT(DAY FROM NEW.transaction_date) <= card_closing_day THEN
          billing_date := DATE_TRUNC('month', NEW.transaction_date) + (i - 1) * INTERVAL '1 month';
        ELSE
          billing_date := DATE_TRUNC('month', NEW.transaction_date) + i * INTERVAL '1 month';
        END IF;

        due_date := billing_date + (card_due_day - 1) * INTERVAL '1 day';
        IF billing_date < current_month_start THEN installment_status := 'paid'; ELSE installment_status := 'pending'; END IF;

        INSERT INTO installments (transaction_id, household_id, credit_card_id, installment_number, total_installments, amount, amount_cents, billing_month, due_date, status, created_at, updated_at) 
        VALUES (NEW.id, NEW.household_id, NEW.credit_card_id, i, NEW.total_installments, installment_amount, installment_amount_cents, billing_date, due_date, installment_status, NOW(), NOW());
      END LOOP;

  -- BRANCH 2: BANK ACCOUNT (Recurring - Repetition)
  ELSIF NEW.account_id IS NOT NULL THEN
      -- Use Input Amount as Monthly Amount (No Division)
      installment_amount := NEW.amount;
      
      -- Update current transaction description only (amount is already correct as the monthly value)
      UPDATE transactions 
      SET 
        description = NEW.description || ' (1/' || NEW.total_installments || ')'
      WHERE id = NEW.id;

      -- Create FUTURE transactions
      FOR i IN 2..NEW.total_installments LOOP
        INSERT INTO transactions (
            household_id, account_id, category_id,
            description, type, status,
            amount, transaction_date,
            is_installment, total_installments, 
            created_at, updated_at
        ) VALUES (
            NEW.household_id, NEW.account_id, NEW.category_id,
            NEW.description || ' (' || i || '/' || NEW.total_installments || ')', 
            NEW.type, 
            'pending',
            installment_amount, -- Use same amount
            (NEW.transaction_date + ((i - 1) || ' months')::INTERVAL)::DATE,
            FALSE, 1,
            NOW(), NOW()
        );
      END LOOP;

  ELSE
      RAISE EXCEPTION 'Installment transactions require a valid Credit Card or Bank Account.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
