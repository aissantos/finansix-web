-- ============================================================================
-- Migration: Soft Delete Cascade for Installments
-- Versão: 1.5.0.2
-- Data: 10/01/2026
-- Problema: Quando transação é deletada, parcelas não são marcadas como deletadas
-- Solução: Trigger que propaga soft delete para installments
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION: Soft delete cascade para installments
-- ============================================================================

CREATE OR REPLACE FUNCTION soft_delete_cascade_installments()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma transação é soft-deleted (deleted_at IS NOT NULL)
  -- marcar todas as parcelas associadas como deletadas também
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE installments
    SET 
      deleted_at = NEW.deleted_at,
      updated_at = NEW.deleted_at
    WHERE transaction_id = NEW.id
      AND deleted_at IS NULL;
  END IF;
  
  -- Quando uma transação é restaurada (deleted_at IS NULL)
  -- restaurar todas as parcelas também
  IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
    UPDATE installments
    SET 
      deleted_at = NULL,
      updated_at = NOW()
    WHERE transaction_id = NEW.id
      AND deleted_at IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. TRIGGER: Executar função após update de transactions
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_soft_delete_cascade_installments ON transactions;

CREATE TRIGGER trigger_soft_delete_cascade_installments
  AFTER UPDATE OF deleted_at ON transactions
  FOR EACH ROW
  WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
  EXECUTE FUNCTION soft_delete_cascade_installments();

-- ============================================================================
-- 3. MIGRATION: Corrigir dados históricos
-- ============================================================================

-- Marcar como deletadas todas as parcelas cujas transações já foram deletadas
UPDATE installments i
SET 
  deleted_at = t.deleted_at,
  updated_at = NOW()
FROM transactions t
WHERE i.transaction_id = t.id
  AND t.deleted_at IS NOT NULL
  AND i.deleted_at IS NULL;

-- ============================================================================
-- 4. ADD COMMENT
-- ============================================================================

COMMENT ON FUNCTION soft_delete_cascade_installments IS 
'Propaga soft delete de transactions para installments. Quando uma transação é deletada (deleted_at NOT NULL), todas as parcelas associadas também são marcadas como deletadas.';

COMMENT ON TRIGGER trigger_soft_delete_cascade_installments ON transactions IS 
'Trigger que executa soft_delete_cascade_installments após UPDATE em deleted_at da tabela transactions.';

-- ============================================================================
-- 5. VERIFICATION QUERY (para testar após migration)
-- ============================================================================

-- Query para verificar se há parcelas órfãs (transaction deletada mas parcela ativa)
-- SELECT 
--   i.id as installment_id,
--   i.transaction_id,
--   i.deleted_at as installment_deleted_at,
--   t.deleted_at as transaction_deleted_at
-- FROM installments i
-- JOIN transactions t ON i.transaction_id = t.id
-- WHERE t.deleted_at IS NOT NULL
--   AND i.deleted_at IS NULL;
-- 
-- Resultado esperado: 0 linhas (nenhuma parcela órfã)
