-- ============================================================================
-- Migration: Fix Security Definer Views (Enable RLS)
-- Date: 2026-01-29
-- Purpose: Force views to use the invoking user's permissions (Row Level Security)
--          instead of the view owner's permissions (Security Definer).
-- Resolves: Lint errors for security_definer_view
-- ============================================================================

-- 1. transactions_with_installments_expanded
-- Enforce RLS for this view which exposes transaction details
ALTER VIEW transactions_with_installments_expanded SET (security_invoker = true);

-- 2. household_free_balance
-- Enforce RLS for financial balance calculations
ALTER VIEW household_free_balance SET (security_invoker = true);

-- 3. credit_card_limits
-- Enforce RLS for credit card limit and usage data
ALTER VIEW credit_card_limits SET (security_invoker = true);

-- 4. monthly_summary
-- Enforce RLS for monthly financial summaries
ALTER VIEW monthly_summary SET (security_invoker = true);

-- ============================================================================
-- Migration Complete
-- ============================================================================
