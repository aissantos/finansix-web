-- ============================================================================
-- Migration: Robust Transfer Fix (Flexible Parsing)
-- Date: 2026-01-25
-- Purpose: 1. Force type='transfer' for ALL 'Transferência' transactions.
--          2. Flexibly parse Source/Dest to fix signs (handling different separators).
--          3. Use ILIKE and TRIM for matching.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fix_transfer_record_robust()
RETURNS TRIGGER AS $$
DECLARE
  v_acc_name text;
  v_description text;
  v_separator text;
  v_parts text[];
  v_source text;
  v_dest text;
BEGIN
  v_description := NEW.description;
  
  -- 1. Always force type to 'transfer' if it looks like one
  IF v_description ILIKE 'Transferência:%' OR v_description ILIKE '%Transferência%' THEN
    NEW.type := 'transfer';
    
    -- Get Account Name
    SELECT name INTO v_acc_name FROM accounts WHERE id = NEW.account_id;
    
    -- 2. Determine Separator
    IF v_description LIKE '% → %' THEN
      v_separator := ' → ';
    ELSIF v_description LIKE '% -> %' THEN
      v_separator := ' -> ';
    ELSIF v_description LIKE '% - %' THEN
      v_separator := ' - ';
    ELSE
      v_separator := NULL;
    END IF;
    
    -- 3. Parse and Fix Sign
    IF v_separator IS NOT NULL THEN
      v_parts := string_to_array(v_description, v_separator);
      
      IF array_length(v_parts, 1) >= 2 THEN
         -- Clean Source: remove "Transferência: " prefix
         v_source := trim(regexp_replace(v_parts[1], '^.*Transferência:\s*', '', 'i'));
         v_dest := trim(v_parts[2]);
         
         -- Compare with current account
         IF trim(v_acc_name) ILIKE v_source THEN
           -- Source: Negative
           NEW.amount := -ABS(NEW.amount);
           NEW.amount_cents := -ABS(NEW.amount_cents);
         ELSIF trim(v_acc_name) ILIKE v_dest THEN
           -- Dest: Positive
           NEW.amount := ABS(NEW.amount);
           NEW.amount_cents := ABS(NEW.amount_cents);
         END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace trigger
DROP TRIGGER IF EXISTS tr_smart_transfer_fix ON transactions;
DROP TRIGGER IF EXISTS tr_force_transfer_type ON transactions;

CREATE TRIGGER tr_robust_transfer_fix
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fix_transfer_record_robust();


-- Run Global Fix on Existing Data
DO $$
DECLARE
  r RECORD;
  v_acc_name text;
  v_description text;
  v_separator text;
  v_parts text[];
  v_source text;
  v_dest text;
BEGIN
  -- Iterate all potential transfers
  FOR r IN SELECT * FROM transactions WHERE description ILIKE '%Transferência%' LOOP
    
    v_description := r.description;
    
    -- Determine Separator
    IF v_description LIKE '% → %' THEN
      v_separator := ' → ';
    ELSIF v_description LIKE '% -> %' THEN
      v_separator := ' -> ';
    ELSIF v_description LIKE '% - %' THEN
      v_separator := ' - ';
    ELSE
      v_separator := NULL;
    END IF;
    
    -- Always fix type
    UPDATE transactions SET type = 'transfer' WHERE id = r.id;
    
    IF v_separator IS NOT NULL THEN
       SELECT name INTO v_acc_name FROM accounts WHERE id = r.account_id;
       v_parts := string_to_array(v_description, v_separator);
       
       IF array_length(v_parts, 1) >= 2 THEN
         v_source := trim(regexp_replace(v_parts[1], '^.*Transferência:\s*', '', 'i'));
         v_dest := trim(v_parts[2]);
         
         IF trim(v_acc_name) ILIKE v_source THEN
           -- Source: Negative
           UPDATE transactions SET amount = -ABS(amount), amount_cents = -ABS(amount_cents) WHERE id = r.id;
         ELSIF trim(v_acc_name) ILIKE v_dest THEN
           -- Dest: Positive
           UPDATE transactions SET amount = ABS(amount), amount_cents = ABS(amount_cents) WHERE id = r.id;
         END IF;
       END IF;
    END IF;
    
  END LOOP;
END $$;
