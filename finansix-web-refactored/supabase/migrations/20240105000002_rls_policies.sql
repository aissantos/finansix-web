-- Migration: Row Level Security Policies
-- CRITICAL: This ensures data isolation between households
-- All queries are filtered by household_id which the user belongs to

-- ============================================================================
-- 1. Helper function to get user's household_id (SECURED SCHEMA STRATEGY)
-- ============================================================================

-- Cria um schema privado para funções de sistema que não devem aparecer na API
CREATE SCHEMA IF NOT EXISTS _secured;

-- Revoga permissões públicas deste schema (ninguém vê via API)
REVOKE ALL ON SCHEMA _secured FROM anon, authenticated;
GRANT USAGE ON SCHEMA _secured TO service_role;
GRANT USAGE ON SCHEMA _secured TO postgres;

-- Cria a função dentro do schema protegido
CREATE OR REPLACE FUNCTION _secured.user_household_id()
RETURNS UUID AS $$
  SELECT household_id
  FROM public.household_members
  WHERE user_id = auth.uid()
  -- Adicione filtros de role se necessário, ex: AND role IN ('owner', 'admin', 'member')
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Permite que o RLS (executando como usuário autenticado) chame esta função
GRANT EXECUTE ON FUNCTION _secured.user_household_id() TO authenticated;
GRANT EXECUTE ON FUNCTION _secured.user_household_id() TO service_role;

-- ============================================================================
-- 2. Enable RLS on all tables
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
-- 3. Households policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their households" ON households;
CREATE POLICY "Users can view their households" ON households
  FOR SELECT
  USING (id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create households" ON households;
CREATE POLICY "Users can create households" ON households
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners can update their households" ON households;
CREATE POLICY "Owners can update their households" ON households
  FOR UPDATE
  USING (id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- ============================================================================
-- 4. Household members policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
CREATE POLICY "Users can view members of their households" ON household_members
  FOR SELECT
  USING (household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert themselves" ON household_members;
CREATE POLICY "Users can insert themselves" ON household_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage members" ON household_members;
CREATE POLICY "Owners can manage members" ON household_members
  FOR ALL
  USING (household_id IN (
    SELECT household_id FROM household_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- ============================================================================
-- 5. Accounts policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view household accounts" ON accounts;
CREATE POLICY "Users can view household accounts" ON accounts
  FOR SELECT
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can create accounts" ON accounts;
CREATE POLICY "Users can create accounts" ON accounts
  FOR INSERT
  WITH CHECK (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can update household accounts" ON accounts;
CREATE POLICY "Users can update household accounts" ON accounts
  FOR UPDATE
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can delete household accounts" ON accounts;
CREATE POLICY "Users can delete household accounts" ON accounts
  FOR DELETE
  USING (household_id = _secured.user_household_id());

-- ============================================================================
-- 6. Credit cards policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view household cards" ON credit_cards;
CREATE POLICY "Users can view household cards" ON credit_cards
  FOR SELECT
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can create cards" ON credit_cards;
CREATE POLICY "Users can create cards" ON credit_cards
  FOR INSERT
  WITH CHECK (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can update household cards" ON credit_cards;
CREATE POLICY "Users can update household cards" ON credit_cards
  FOR UPDATE
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can delete household cards" ON credit_cards;
CREATE POLICY "Users can delete household cards" ON credit_cards
  FOR DELETE
  USING (household_id = _secured.user_household_id());

-- ============================================================================
-- 7. Categories policies (includes system categories with null household_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view categories" ON categories;
CREATE POLICY "Users can view categories" ON categories
  FOR SELECT
  USING (
    household_id IS NULL -- System categories visible to all
    OR household_id = _secured.user_household_id()
  );

DROP POLICY IF EXISTS "Users can create categories" ON categories;
CREATE POLICY "Users can create categories" ON categories
  FOR INSERT
  WITH CHECK (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE
  USING (household_id = _secured.user_household_id());

-- ============================================================================
-- 8. Transactions policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view household transactions" ON transactions;
CREATE POLICY "Users can view household transactions" ON transactions
  FOR SELECT
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can create transactions" ON transactions;
CREATE POLICY "Users can create transactions" ON transactions
  FOR INSERT
  WITH CHECK (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can update household transactions" ON transactions;
CREATE POLICY "Users can update household transactions" ON transactions
  FOR UPDATE
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can delete household transactions" ON transactions;
CREATE POLICY "Users can delete household transactions" ON transactions
  FOR DELETE
  USING (household_id = _secured.user_household_id());

-- ============================================================================
-- 9. Installments policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view household installments" ON installments;
CREATE POLICY "Users can view household installments" ON installments
  FOR SELECT
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can create installments" ON installments;
CREATE POLICY "Users can create installments" ON installments
  FOR INSERT
  WITH CHECK (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can update household installments" ON installments;
CREATE POLICY "Users can update household installments" ON installments
  FOR UPDATE
  USING (household_id = _secured.user_household_id());

-- ============================================================================
-- 10. Credit card statements policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view household statements" ON credit_card_statements;
CREATE POLICY "Users can view household statements" ON credit_card_statements
  FOR SELECT
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can manage household statements" ON credit_card_statements;
CREATE POLICY "Users can manage household statements" ON credit_card_statements
  FOR ALL
  USING (household_id = _secured.user_household_id());

-- ============================================================================
-- 11. Expected transactions policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view expected transactions" ON expected_transactions;
CREATE POLICY "Users can view expected transactions" ON expected_transactions
  FOR SELECT
  USING (household_id = _secured.user_household_id());

DROP POLICY IF EXISTS "Users can manage expected transactions" ON expected_transactions;
CREATE POLICY "Users can manage expected transactions" ON expected_transactions
  FOR ALL
  USING (household_id = _secured.user_household_id());

-- ============================================================================
-- 12. Grant usage to authenticated users
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 13. Index for RLS performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_household_id ON transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_accounts_household_id ON accounts(household_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_household_id ON credit_cards(household_id);
CREATE INDEX IF NOT EXISTS idx_installments_household_id ON installments(household_id);

-- ============================================================================
-- 14. Documentation
-- ============================================================================
COMMENT ON FUNCTION _secured.user_household_id() IS 
'Returns the household_id for the currently authenticated user.
Located in _secured schema to prevent public API exposure.
Used in RLS policies to ensure users can only access their household data.';