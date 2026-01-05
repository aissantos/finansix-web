-- Migration: 20260105_add_installment_columns.sql
-- Adds missing columns to `transactions` required by the installments trigger

-- Add columns used by the installments trigger if they don't already exist
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS installment_number smallint;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS billing_month date;

-- No destructive changes; this makes the trigger safe to run on insert
