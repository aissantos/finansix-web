-- Migration: Fix Installment Display - Show Each Installment in Its Billing Month
-- Created: 2026-01-10
-- 
-- PROBLEMA: Transações parceladas aparecem todas no mês da compra
-- SOLUÇÃO: View que expande parcelas como transações virtuais nos meses corretos

-- ============================================================================
-- 1. CREATE VIEW: transactions_with_installments_expanded
-- ============================================================================

-- Esta view "explode" transações parceladas em múltiplas linhas,
-- uma para cada parcela, usando o billing_month da parcela como data de referência

CREATE OR REPLACE VIEW transactions_with_installments_expanded AS
SELECT 
  -- Para transações NÃO parceladas: usar dados originais
  CASE 
    WHEN t.is_installment = false OR t.total_installments IS NULL OR t.total_installments <= 1
    THEN t.id::text
    -- Para transações parceladas: ID composto com número da parcela
    ELSE t.id::text || '-installment-' || i.installment_number::text
  END as virtual_id,
  
  t.id as transaction_id,
  t.household_id,
  t.type,
  t.description,
  
  -- AMOUNT: Para parceladas, usar valor da parcela individual
  CASE 
    WHEN t.is_installment = true AND i.id IS NOT NULL
    THEN i.amount
    ELSE t.amount
  END as amount,
  
  -- TRANSACTION DATE: Para parceladas, usar billing_month da parcela
  CASE 
    WHEN t.is_installment = true AND i.id IS NOT NULL
    THEN i.billing_month::date
    ELSE t.transaction_date
  END as transaction_date,
  
  t.category_id,
  t.account_id,
  t.credit_card_id,
  t.status,
  t.notes,
  t.is_installment,
  t.total_installments,
  
  -- Informações da parcela específica
  i.installment_number,
  i.billing_month,
  i.due_date,
  i.id as installment_id,
  
  t.created_at,
  t.updated_at,
  t.deleted_at

FROM transactions t
LEFT JOIN installments i 
  ON t.id = i.transaction_id 
  AND t.is_installment = true
  AND i.deleted_at IS NULL

WHERE t.deleted_at IS NULL
  -- Para transações parceladas, só incluir se tiver parcela associada
  AND (
    t.is_installment = false 
    OR t.total_installments IS NULL 
    OR t.total_installments <= 1
    OR i.id IS NOT NULL
  );

-- Grant permissions
GRANT SELECT ON transactions_with_installments_expanded TO authenticated;
GRANT SELECT ON transactions_with_installments_expanded TO service_role;

-- Add comment
COMMENT ON VIEW transactions_with_installments_expanded IS 
'View que expande transações parceladas em múltiplas linhas, uma por parcela, usando billing_month como transaction_date. Transações não-parceladas aparecem normalmente.';

-- ============================================================================
-- 2. CREATE INDEXES for better performance
-- ============================================================================

-- Índice na tabela installments para melhorar join
CREATE INDEX IF NOT EXISTS idx_installments_transaction_id 
  ON installments(transaction_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_installments_billing_month 
  ON installments(billing_month) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. HELPER FUNCTION: Get transactions for a specific month (including installments)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_monthly_transactions(
  p_household_id uuid,
  p_year integer,
  p_month integer
)
RETURNS TABLE (
  virtual_id text,
  transaction_id uuid,
  household_id uuid,
  type text,
  description text,
  amount numeric,
  transaction_date date,
  category_id uuid,
  account_id uuid,
  credit_card_id uuid,
  status text,
  is_installment boolean,
  total_installments integer,
  installment_number integer,
  billing_month date,
  due_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.virtual_id,
    v.transaction_id,
    v.household_id,
    v.type,
    v.description,
    v.amount,
    v.transaction_date,
    v.category_id,
    v.account_id,
    v.credit_card_id,
    v.status,
    v.is_installment,
    v.total_installments,
    v.installment_number,
    v.billing_month,
    v.due_date
  FROM transactions_with_installments_expanded v
  WHERE v.household_id = p_household_id
    AND EXTRACT(YEAR FROM v.transaction_date) = p_year
    AND EXTRACT(MONTH FROM v.transaction_date) = p_month
  ORDER BY v.transaction_date DESC, v.description;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_monthly_transactions(uuid, integer, integer) TO authenticated;

COMMENT ON FUNCTION get_monthly_transactions IS 
'Retorna todas as transações de um mês específico, incluindo parcelas individuais nos seus meses de vencimento';

-- ============================================================================
-- 4. VERIFICATION QUERY (for testing)
-- ============================================================================

-- Para testar, execute:
-- SELECT * FROM transactions_with_installments_expanded 
-- WHERE household_id = '<your-household-id>'
-- AND EXTRACT(YEAR FROM transaction_date) = 2026
-- AND EXTRACT(MONTH FROM transaction_date) = 2
-- ORDER BY transaction_date DESC;

-- Ou use a função:
-- SELECT * FROM get_monthly_transactions('<your-household-id>', 2026, 2);
