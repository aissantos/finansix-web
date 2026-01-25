-- ============================================================================
-- Migration: Remove Persistent Positive Amount Constraint
-- Date: 2026-01-25
-- Purpose: The 'check_positive_amount' constraint seems to persist or be re-added
--          by intermediate migrations despite previous drop attempts.
--          This migration runs LAST to ensure it is definitely gone.
-- ============================================================================

-- Explicitly drop the known constraint from 'atomic_transactions.sql'
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_positive_amount;

-- Drop any other potential aliases
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS amount_positive;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_amount_cents_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS check_amount_positive;

-- Ensure no future issues with Amount > 0 check
-- We already converted Type to TEXT in the previous migration, so we are good there.
