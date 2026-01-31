-- Migration: Add Interest and Fine rates to Credit Cards
-- Date: 2026-01-31
-- Purpose: Store credit card specific interest and fine rates for invoice payment calculations.

DO $$
BEGIN
    -- Add interest_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_cards' AND column_name = 'interest_rate'
    ) THEN
        ALTER TABLE credit_cards ADD COLUMN interest_rate DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- Add fine_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credit_cards' AND column_name = 'fine_rate'
    ) THEN
        ALTER TABLE credit_cards ADD COLUMN fine_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
END $$;
