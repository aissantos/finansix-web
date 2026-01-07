-- Migration: 20250105_rls_and_installments.sql
-- Enables RLS on all tables and creates installment explosion trigger

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_card_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expected_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. HELPER FUNCTION: Get user's household IDs
-- ============================================================================

-- Ensure we can change the return type by dropping any existing function first
DROP FUNCTION IF EXISTS get_user_household_ids() CASCADE;

CREATE OR REPLACE FUNCTION get_user_household_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY(
    SELECT household_id 
    FROM household_members 
    WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. RLS POLICIES: HOUSEHOLDS
-- ============================================================================

-- Users can view households they belong to
DROP POLICY IF EXISTS "Users can view their households" ON households;
CREATE POLICY "Users can view their households"
  ON households FOR SELECT
  USING (id = ANY(get_user_household_ids()));

-- Only owners can update their households
DROP POLICY IF EXISTS "Owners can update their households" ON households;
CREATE POLICY "Owners can update their households"
  ON households FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Any authenticated user can create a household
DROP POLICY IF EXISTS "Authenticated users can create households" ON households;
CREATE POLICY "Authenticated users can create households"
  ON households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- 4. RLS POLICIES: HOUSEHOLD MEMBERS
-- ============================================================================

-- Users can view members of their households
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
CREATE POLICY "Users can view household members"
  ON household_members FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

-- Owners and admins can manage members
DROP POLICY IF EXISTS "Owners can manage members" ON household_members;
CREATE POLICY "Owners can manage members"
  ON household_members FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 5. RLS POLICIES: ACCOUNTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view household accounts" ON accounts;
CREATE POLICY "Users can view household accounts"
  ON accounts FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can create accounts in their household" ON accounts;
CREATE POLICY "Users can create accounts in their household"
  ON accounts FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can update household accounts" ON accounts;
CREATE POLICY "Users can update household accounts"
  ON accounts FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can delete household accounts" ON accounts;
CREATE POLICY "Users can delete household accounts"
  ON accounts FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================================
-- 6. RLS POLICIES: CREDIT CARDS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view household credit cards" ON credit_cards;
CREATE POLICY "Users can view household credit cards"
  ON credit_cards FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can create credit cards in their household" ON credit_cards;
CREATE POLICY "Users can create credit cards in their household"
  ON credit_cards FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can update household credit cards" ON credit_cards;
CREATE POLICY "Users can update household credit cards"
  ON credit_cards FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can delete household credit cards" ON credit_cards;
CREATE POLICY "Users can delete household credit cards"
  ON credit_cards FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================================
-- 7. RLS POLICIES: CATEGORIES
-- ============================================================================

-- Users can view default (null household) + their household categories
DROP POLICY IF EXISTS "Users can view categories" ON categories;
CREATE POLICY "Users can view categories"
  ON categories FOR SELECT
  USING (
    household_id IS NULL -- Default/system categories
    OR household_id = ANY(get_user_household_ids())
  );

DROP POLICY IF EXISTS "Users can create categories in their household" ON categories;
CREATE POLICY "Users can create categories in their household"
  ON categories FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can update household categories" ON categories;
CREATE POLICY "Users can update household categories"
  ON categories FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================================
-- 8. RLS POLICIES: TRANSACTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view household transactions" ON transactions;
CREATE POLICY "Users can view household transactions"
  ON transactions FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can create transactions in their household" ON transactions;
CREATE POLICY "Users can create transactions in their household"
  ON transactions FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can update household transactions" ON transactions;
CREATE POLICY "Users can update household transactions"
  ON transactions FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can delete household transactions" ON transactions;
CREATE POLICY "Users can delete household transactions"
  ON transactions FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================================
-- 9. RLS POLICIES: INSTALLMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view household installments" ON installments;
CREATE POLICY "Users can view household installments"
  ON installments FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can manage household installments" ON installments;
CREATE POLICY "Users can manage household installments"
  ON installments FOR ALL
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================================
-- 10. RLS POLICIES: CREDIT CARD STATEMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view household statements" ON credit_card_statements;
CREATE POLICY "Users can view household statements"
  ON credit_card_statements FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can manage household statements" ON credit_card_statements;
CREATE POLICY "Users can manage household statements"
  ON credit_card_statements FOR ALL
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================================
-- 11. RLS POLICIES: EXPECTED TRANSACTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view household expected transactions" ON expected_transactions;
CREATE POLICY "Users can view household expected transactions"
  ON expected_transactions FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS "Users can manage household expected transactions" ON expected_transactions;
CREATE POLICY "Users can manage household expected transactions"
  ON expected_transactions FOR ALL
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================================
-- 12. TRIGGER: AUTO-EXPLODE INSTALLMENTS
-- ============================================================================

CREATE OR REPLACE FUNCTION explode_installments()
RETURNS TRIGGER AS $$
DECLARE
  card credit_cards%ROWTYPE;
  purchase_date DATE;
  installment_amount NUMERIC;
  billing_month DATE;
  due_date DATE;
  closing_day INT;
  due_day INT;
  i INT;
BEGIN
  -- Skip if not an installment transaction
  IF NOT NEW.is_installment OR NEW.total_installments <= 1 OR NEW.credit_card_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get credit card details
  SELECT * INTO card FROM credit_cards WHERE id = NEW.credit_card_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credit card not found: %', NEW.credit_card_id;
  END IF;

  closing_day := card.closing_day;
  due_day := card.due_day;
  purchase_date := NEW.transaction_date;
  installment_amount := ROUND(NEW.amount / NEW.total_installments, 2);

  -- Generate installments
  FOR i IN 0..(NEW.total_installments - 1) LOOP
    -- Calculate billing month
    IF EXTRACT(DAY FROM purchase_date) >= closing_day THEN
      billing_month := DATE_TRUNC('month', purchase_date) + INTERVAL '1 month';
    ELSE
      billing_month := DATE_TRUNC('month', purchase_date);
    END IF;
    billing_month := billing_month + (i * INTERVAL '1 month');

    -- Calculate due date
    IF due_day >= closing_day THEN
      due_date := billing_month + ((due_day - 1) * INTERVAL '1 day');
    ELSE
      due_date := billing_month + INTERVAL '1 month' + ((due_day - 1) * INTERVAL '1 day');
    END IF;

    -- Insert installment
    INSERT INTO installments (
      household_id,
      transaction_id,
      credit_card_id,
      installment_number,
      total_installments,
      amount,
      billing_month,
      due_date,
      status
    ) VALUES (
      NEW.household_id,
      NEW.id,
      NEW.credit_card_id,
      i + 1,
      NEW.total_installments,
      installment_amount,
      billing_month,
      due_date,
      'pending'
    );
  END LOOP;

  -- Update transaction with first installment info
  NEW.installment_number := 1;
  NEW.billing_month := DATE_TRUNC('month', 
    CASE 
      WHEN EXTRACT(DAY FROM purchase_date) >= closing_day 
      THEN purchase_date + INTERVAL '1 month'
      ELSE purchase_date
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for installment explosion
DROP TRIGGER IF EXISTS trigger_explode_installments ON transactions;
CREATE TRIGGER trigger_explode_installments
  AFTER INSERT ON transactions
  FOR EACH ROW
  WHEN (NEW.is_installment = true AND NEW.total_installments > 1 AND NEW.credit_card_id IS NOT NULL)
  EXECUTE FUNCTION explode_installments();

-- ============================================================================
-- 13. VIEW: CREDIT CARD LIMITS (with RLS bypass for aggregation)
-- ============================================================================

-- DROP & recreate to avoid column-name/ordering conflicts with previous view
DROP VIEW IF EXISTS credit_card_limits CASCADE;
CREATE OR REPLACE VIEW credit_card_limits AS
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
       AND i.billing_month <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
    0
  ) as used_limit,
  cc.credit_limit - COALESCE(
    (SELECT SUM(i.amount) 
     FROM installments i 
     WHERE i.credit_card_id = cc.id 
       AND i.status = 'pending'
       AND i.billing_month <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'),
    0
  ) as available_limit
FROM credit_cards cc
WHERE cc.is_active = true AND cc.deleted_at IS NULL;

-- Grant access to the view
GRANT SELECT ON credit_card_limits TO authenticated;

-- ============================================================================
-- 14. INDEX OPTIMIZATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_household_date 
  ON transactions(household_id, transaction_date DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_installments_billing_month 
  ON installments(household_id, billing_month, status);

CREATE INDEX IF NOT EXISTS idx_installments_credit_card 
  ON installments(credit_card_id, status, billing_month);

CREATE INDEX IF NOT EXISTS idx_household_members_user 
  ON household_members(user_id, household_id);

-- ============================================================================
-- DONE
-- ============================================================================
