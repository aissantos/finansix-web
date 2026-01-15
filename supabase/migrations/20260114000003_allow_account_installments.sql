-- Migration: Allow Recurring Installments on Bank Accounts via Trigger
-- Date: 2026-01-14
-- Author: Antigravity

-- 1. Redefine explode_installments to handle both Credit Cards and Bank Accounts
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
  -- Only process if this is a valid installment transaction
  IF NEW.is_installment = FALSE OR NEW.total_installments <= 1 THEN
    RETURN NEW;
  END IF;

  -- Common Calculations
  installment_amount := ROUND(NEW.amount / NEW.total_installments, 2);
  installment_amount_cents := ROUND((NEW.amount * 100) / NEW.total_installments);
  current_month_start := DATE_TRUNC('month', CURRENT_DATE);

  -- BRANCH 1: CREDIT CARD (Standard logic: create installments records)
  IF NEW.credit_card_id IS NOT NULL THEN
      -- Validate Card
      SELECT closing_day, due_day INTO card_closing_day, card_due_day
      FROM credit_cards
      WHERE id = NEW.credit_card_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Credit card not found';
      END IF;

      -- Create installment records in 'installments' table
      FOR i IN 1..NEW.total_installments LOOP
        -- Calculate billing date
        IF EXTRACT(DAY FROM NEW.transaction_date) <= card_closing_day THEN
          billing_date := DATE_TRUNC('month', NEW.transaction_date) + (i - 1) * INTERVAL '1 month';
        ELSE
          billing_date := DATE_TRUNC('month', NEW.transaction_date) + i * INTERVAL '1 month';
        END IF;

        due_date := billing_date + (card_due_day - 1) * INTERVAL '1 day';

        IF billing_date < current_month_start THEN
          installment_status := 'paid';
        ELSE
          installment_status := 'pending';
        END IF;

        INSERT INTO installments (
          transaction_id, household_id, credit_card_id,
          installment_number, total_installments,
          amount, amount_cents,
          billing_month, due_date, status,
          created_at, updated_at
        ) VALUES (
          NEW.id, NEW.household_id, NEW.credit_card_id,
          i, NEW.total_installments,
          installment_amount, installment_amount_cents,
          billing_date, due_date, installment_status,
          NOW(), NOW()
        );
      END LOOP;

  -- BRANCH 2: BANK ACCOUNT / PIX (Recurring logic: create future transactions)
  ELSIF NEW.account_id IS NOT NULL THEN
      -- 1. Update the CURRENT transaction (the 1st one) to match the installment amount
      --    and append (1/N) to description
      UPDATE transactions 
      SET 
        amount = installment_amount,
        description = NEW.description || ' (1/' || NEW.total_installments || ')'
      WHERE id = NEW.id;

      -- 2. Generate FUTURE transactions (2..N)
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
            'pending', -- Future transactions are initially pending
            installment_amount,
            (NEW.transaction_date + ((i - 1) || ' months')::INTERVAL)::DATE,
            FALSE, 1, -- Important: Not marked as installment to prevent recursion
            NOW(), NOW()
        );
      END LOOP;

  ELSE
      -- Failsafe if neither is provided (should limit in validation, but DB ensures consistency)
      RAISE EXCEPTION 'Installment transactions require a valid Credit Card or Bank Account.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-comment to reflect new capabilities
COMMENT ON FUNCTION explode_installments() IS 
'Automatically handles installments. 
- For Credit Cards: Creates records in installments table.
- For Bank Accounts: Creates future transaction records for recurrence.';
