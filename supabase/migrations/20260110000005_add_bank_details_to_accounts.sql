-- ============================================================================
-- Migration: Add Bank Details to Accounts
-- Versão: 1.5.0.3
-- Data: 10/01/2026
-- Adiciona campos de dados bancários (agência, conta, banco, etc)
-- ============================================================================

-- ============================================================================
-- 1. ADD COLUMNS: Bank details
-- ============================================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS bank_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS branch_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS account_digit VARCHAR(2),
  ADD COLUMN IF NOT EXISTS pix_key VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('cpf', 'cnpj', 'email', 'phone', 'random'));

-- ============================================================================
-- 2. ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN accounts.bank_code IS 'Código do banco (ex: 001 para Banco do Brasil, 237 para Bradesco)';
COMMENT ON COLUMN accounts.bank_name IS 'Nome do banco (ex: Nubank, Itaú, Banco do Brasil)';
COMMENT ON COLUMN accounts.branch_number IS 'Número da agência (ex: 0001, 1234)';
COMMENT ON COLUMN accounts.account_number IS 'Número da conta sem dígito (ex: 12345678)';
COMMENT ON COLUMN accounts.account_digit IS 'Dígito verificador da conta (ex: 9)';
COMMENT ON COLUMN accounts.pix_key IS 'Chave PIX (CPF, email, telefone, ou chave aleatória)';
COMMENT ON COLUMN accounts.pix_key_type IS 'Tipo da chave PIX: cpf, cnpj, email, phone, ou random';

-- ============================================================================
-- 3. CREATE INDEX for bank_code lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_bank_code 
  ON accounts(bank_code) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- 4. VERIFICATION QUERY
-- ============================================================================

-- Para verificar as novas colunas:
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable,
--   column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'accounts' 
--   AND column_name IN ('bank_code', 'bank_name', 'branch_number', 'account_number', 'account_digit', 'pix_key', 'pix_key_type')
-- ORDER BY ordinal_position;
