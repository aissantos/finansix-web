-- ============================================================================
-- Migration: Smart Transfer Fix (Direction & Type)
-- Date: 2026-01-25
-- Purpose: 1. Parse 'Transferência: A → B' descriptions.
--          2. Determine if transaction is Source (A) or Dest (B) based on Account Name.
--          3. Force Type='transfer' and Correct Sign (- for Source, + for Dest).
-- ============================================================================

-- Function to normalize transfer transactions
CREATE OR REPLACE FUNCTION public.fix_transfer_record()
RETURNS TRIGGER AS $$
DECLARE
  v_acc_name text;
  v_parts text[];
  v_source text;
  v_dest text;
BEGIN
  -- Only process if description contains the arrow pattern
  IF NEW.description LIKE '% → %' AND (NEW.description ILIKE 'Transferência:%' OR NEW.description ILIKE '%Transferência%') THEN
    
    -- Get Account Name
    SELECT name INTO v_acc_name FROM accounts WHERE id = NEW.account_id;
    
    -- Parse Description: "Transferência: Source → Dest"
    -- Example: "Transferência: Swille → Bradesco"
    -- Split by ' → '
    v_parts := string_to_array(NEW.description, ' → ');
    
    IF array_length(v_parts, 1) = 2 THEN
       -- Clean up Source part (remove "Transferência: ")
       v_source := trim(regexp_replace(v_parts[1], '^.*Transferência:\s*', '', 'i'));
       v_dest := trim(v_parts[2]);
       
       -- Logic: Match Account Name
       IF v_acc_name = v_source THEN
         -- It is SOURCE. Must be Negative.
         NEW.type := 'transfer';
         NEW.amount := -ABS(NEW.amount);
         NEW.amount_cents := -ABS(NEW.amount_cents); 
       ELSIF v_acc_name = v_dest THEN
         -- It is DESTINATION. Must be Positive.
         NEW.type := 'transfer';
         NEW.amount := ABS(NEW.amount);
         NEW.amount_cents := ABS(NEW.amount_cents);
       END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the previous simple trigger with this smart one
DROP TRIGGER IF EXISTS tr_force_transfer_type ON transactions;
CREATE TRIGGER tr_smart_transfer_fix
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fix_transfer_record();


-- Run Global Fix on Existing Data
DO $$
DECLARE
  r RECORD;
  v_acc_name text;
  v_parts text[];
  v_source text;
  v_dest text;
BEGIN
  FOR r IN SELECT * FROM transactions WHERE description LIKE '% → %' LOOP
    -- Get Account Name
    SELECT name INTO v_acc_name FROM accounts WHERE id = r.account_id;
    
    v_parts := string_to_array(r.description, ' → ');
    
    IF array_length(v_parts, 1) = 2 THEN
       v_source := trim(regexp_replace(v_parts[1], '^.*Transferência:\s*', '', 'i'));
       v_dest := trim(v_parts[2]);
       
       IF v_acc_name = v_source THEN
         -- Fix Source
         UPDATE transactions 
         SET type = 'transfer', amount = -ABS(amount), amount_cents = -ABS(amount_cents)
         WHERE id = r.id;
       ELSIF v_acc_name = v_dest THEN
         -- Fix Dest
         UPDATE transactions 
         SET type = 'transfer', amount = ABS(amount), amount_cents = ABS(amount_cents)
         WHERE id = r.id;
       END IF;
    END IF;
  END LOOP;
END $$;
