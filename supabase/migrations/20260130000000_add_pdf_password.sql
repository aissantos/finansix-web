-- ============================================================================
-- Migration: Add PDF Password to Credit Cards
-- Date: 2026-01-30
-- Purpose: Store optional password for opening PDF invoices
-- ============================================================================

ALTER TABLE credit_cards 
ADD COLUMN IF NOT EXISTS pdf_password TEXT;

-- Add comment explaining usage
COMMENT ON COLUMN credit_cards.pdf_password IS 'Optional password to automatically open PDF invoices';

-- Since this is sensitive, ideally it should be encrypted, but for this MVP 
-- we will store it as plain text or rely on Supabase Vault if available.
-- For now, proceeding with plain column as per request for simplicity in personal finance app context.
