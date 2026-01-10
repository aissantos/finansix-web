-- ============================================================================
-- Migration: Fix credit_card_limits view to filter deleted installments
-- Versão: 1.5.0
-- Data: 10/01/2026
-- Problema: View não filtra parcelas deletadas, causando cálculo incorreto
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS credit_card_limits;

-- Recreate view with deleted_at filter
CREATE VIEW credit_card_limits AS
SELECT 
  cc.id,
  cc.household_id,
  cc.name,
  cc.credit_limit,
  COALESCE(
    (SELECT SUM(i.amount) 
     FROM installments i 
     WHERE i.credit_card_id = cc.id 
       AND i.status = 'pending'
       AND i.deleted_at IS NULL  -- ✅ ADICIONADO
       AND i.billing_month <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
    0
  ) as used_limit,
  cc.credit_limit - COALESCE(
    (SELECT SUM(i.amount) 
     FROM installments i 
     WHERE i.credit_card_id = cc.id 
       AND i.status = 'pending'
       AND i.deleted_at IS NULL  -- ✅ ADICIONADO
       AND i.billing_month <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
    0
  ) as available_limit
FROM credit_cards cc
WHERE cc.deleted_at IS NULL 
  AND cc.is_active = TRUE
GROUP BY cc.id;

-- Grant permissions
GRANT SELECT ON credit_card_limits TO authenticated;

-- Add comment
COMMENT ON VIEW credit_card_limits IS 
'Calculates credit card limits considering only non-deleted pending installments within current and next billing cycle';
