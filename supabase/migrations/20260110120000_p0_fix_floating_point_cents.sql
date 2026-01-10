-- Migration: Fix Floating Point Precision (Cents Strategy)
-- Priority: P0 (Critical for Data Integrity)
-- Date: 2026-01-10

-- 1. Add new integer columns for precision (Cents)
-- We use BIGINT to ensure we can handle any currency size safely.

DO $$ 
BEGIN
    -- Add to Accounts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'balance_cents') THEN
        ALTER TABLE accounts ADD COLUMN balance_cents BIGINT DEFAULT 0;
    END IF;

    -- Add to Credit Cards
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_cards' AND column_name = 'credit_limit_cents') THEN
        ALTER TABLE credit_cards ADD COLUMN credit_limit_cents BIGINT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_cards' AND column_name = 'available_limit_cents') THEN
        ALTER TABLE credit_cards ADD COLUMN available_limit_cents BIGINT DEFAULT 0;
    END IF;

    -- Add to Transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount_cents') THEN
        ALTER TABLE transactions ADD COLUMN amount_cents BIGINT DEFAULT 0;
    END IF;

    -- Add to Installments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'installments' AND column_name = 'total_amount_cents') THEN
        ALTER TABLE installments ADD COLUMN total_amount_cents BIGINT DEFAULT 0;
    END IF;
END $$;

-- 2. Data Migration (Robust Check)
-- We check if source columns exist before updating to prevent "column does not exist" errors.

DO $$
BEGIN
    -- Accounts: Check for 'balance' or 'initial_balance'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'balance') THEN
        EXECUTE 'UPDATE accounts SET balance_cents = CAST(ROUND(balance * 100) AS BIGINT) WHERE balance_cents = 0 AND balance IS NOT NULL';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'initial_balance') THEN
        EXECUTE 'UPDATE accounts SET balance_cents = CAST(ROUND(initial_balance * 100) AS BIGINT) WHERE balance_cents = 0 AND initial_balance IS NOT NULL';
    END IF;

    -- Credit Cards: Check for 'credit_limit'
    -- We initialize available_limit_cents using credit_limit since available_limit might not exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credit_cards' AND column_name = 'credit_limit') THEN
        EXECUTE 'UPDATE credit_cards SET credit_limit_cents = CAST(ROUND(credit_limit * 100) AS BIGINT), available_limit_cents = CAST(ROUND(credit_limit * 100) AS BIGINT) WHERE credit_limit_cents = 0 AND credit_limit IS NOT NULL';
    END IF;

    -- Transactions: Check for 'amount'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'amount') THEN
        EXECUTE 'UPDATE transactions SET amount_cents = CAST(ROUND(amount * 100) AS BIGINT) WHERE amount_cents = 0 AND amount IS NOT NULL';
    END IF;

    -- Installments: Check for 'total_amount'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'installments' AND column_name = 'total_amount') THEN
        EXECUTE 'UPDATE installments SET total_amount_cents = CAST(ROUND(total_amount * 100) AS BIGINT) WHERE total_amount_cents = 0 AND total_amount IS NOT NULL';
    END IF;
END $$;

-- 3. Cleanup / Verification
-- No cleanup strictly required as we are keeping old columns for backward compatibility for now.