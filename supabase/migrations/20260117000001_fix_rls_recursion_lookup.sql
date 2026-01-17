-- FIX RLS RECURSION WITH LOOKUP TABLE (V3 ROBUST)
-- This migration implements the recommended pattern of using a separate lookup table
-- to break the infinite recursion loop in RLS policies.
-- USES DROP/CREATE PATTERN FOR ROBUSTNESS against existing/missing policies.

-- 1. Create Lookup Table (IF NOT EXISTS to be safe)
CREATE TABLE IF NOT EXISTS household_lookups (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, household_id)
);

-- 2. Security for Lookup Table
ALTER TABLE household_lookups ENABLE ROW LEVEL SECURITY;

-- User can only read their own lookup entries (simple, non-recursive)
DROP POLICY IF EXISTS "Users can view their own lookups" ON household_lookups;
CREATE POLICY "Users can view their own lookups" ON household_lookups
    FOR SELECT USING (user_id = auth.uid());

-- 3. Backfill Data (Idempotent: ON CONFLICT DO NOTHING)
INSERT INTO household_lookups (user_id, household_id, role)
SELECT user_id, household_id, role
FROM household_members
ON CONFLICT (user_id, household_id) DO NOTHING;

-- 4. Sync Triggers (Keep lookup in sync with members)
CREATE OR REPLACE FUNCTION sync_household_lookup()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO household_lookups (user_id, household_id, role)
        VALUES (NEW.user_id, NEW.household_id, NEW.role)
        ON CONFLICT (user_id, household_id) DO UPDATE SET role = NEW.role;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE household_lookups
        SET role = NEW.role
        WHERE user_id = NEW.user_id AND household_id = NEW.household_id;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM household_lookups
        WHERE user_id = OLD.user_id AND household_id = OLD.household_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_household_lookup ON household_members;
CREATE TRIGGER trigger_sync_household_lookup
    AFTER INSERT OR UPDATE OR DELETE ON household_members
    FOR EACH ROW EXECUTE FUNCTION sync_household_lookup();

-- 5. Helper Function V2 (avoid conflict with existing function signature)
CREATE OR REPLACE FUNCTION get_user_household_ids_v2()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT household_id FROM household_lookups WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. Update household_members Policies (The root cause)
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
DROP POLICY IF EXISTS "Owners can manage members" ON household_members;
DROP POLICY IF EXISTS "Safe View Members" ON household_members;
DROP POLICY IF EXISTS "Safe Insert Members" ON household_members;
DROP POLICY IF EXISTS "Safe Update Members" ON household_members;
DROP POLICY IF EXISTS "Safe Delete Members" ON household_members;
-- Drop possibly legacy policies just in case
DROP POLICY IF EXISTS "Member view policy" ON household_members;
DROP POLICY IF EXISTS "Users can insert themselves" ON household_members;

CREATE POLICY "Users can view members of their households" ON household_members
    FOR SELECT USING (
        household_id IN (SELECT household_id FROM household_lookups WHERE user_id = auth.uid())
    );

CREATE POLICY "Owners can manage members" ON household_members
    FOR ALL USING (
        household_id IN (
            SELECT household_id 
            FROM household_lookups 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- 7. RECREATE ALL OTHER POLICIES TO USE V2 FUNCTION
-- Using DROP/CREATE for idempotency

-- Households
DROP POLICY IF EXISTS "Users can view their households" ON households;
CREATE POLICY "Users can view their households" ON households 
    FOR SELECT USING (id IN (SELECT get_user_household_ids_v2()));

-- Accounts
DROP POLICY IF EXISTS "Users can view household accounts" ON accounts;
CREATE POLICY "Users can view household accounts" ON accounts 
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids_v2()));

DROP POLICY IF EXISTS "Members can manage accounts" ON accounts;
CREATE POLICY "Members can manage accounts" ON accounts 
    FOR ALL USING (household_id IN (SELECT get_user_household_ids_v2()));

-- Credit Cards
DROP POLICY IF EXISTS "Users can view household cards" ON credit_cards;
CREATE POLICY "Users can view household cards" ON credit_cards 
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids_v2()));

DROP POLICY IF EXISTS "Members can manage cards" ON credit_cards;
CREATE POLICY "Members can manage cards" ON credit_cards 
    FOR ALL USING (household_id IN (SELECT get_user_household_ids_v2()));

-- Transactions
DROP POLICY IF EXISTS "Users can view household transactions" ON transactions;
CREATE POLICY "Users can view household transactions" ON transactions 
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids_v2()));

DROP POLICY IF EXISTS "Members can manage transactions" ON transactions;
CREATE POLICY "Members can manage transactions" ON transactions 
    FOR ALL USING (household_id IN (SELECT get_user_household_ids_v2()));

-- Installments
DROP POLICY IF EXISTS "Users can view household installments" ON installments;
CREATE POLICY "Users can view household installments" ON installments 
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids_v2()));

DROP POLICY IF EXISTS "Members can manage installments" ON installments;
CREATE POLICY "Members can manage installments" ON installments 
    FOR ALL USING (household_id IN (SELECT get_user_household_ids_v2()));

-- Credit Card Statements
DROP POLICY IF EXISTS "Users can view household statements" ON credit_card_statements;
CREATE POLICY "Users can view household statements" ON credit_card_statements 
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids_v2()));

DROP POLICY IF EXISTS "Members can manage statements" ON credit_card_statements;
CREATE POLICY "Members can manage statements" ON credit_card_statements 
    FOR ALL USING (household_id IN (SELECT get_user_household_ids_v2()));

-- Expected Transactions
DROP POLICY IF EXISTS "Users can view expected transactions" ON expected_transactions;
CREATE POLICY "Users can view expected transactions" ON expected_transactions 
    FOR SELECT USING (household_id IN (SELECT get_user_household_ids_v2()));

DROP POLICY IF EXISTS "Members can manage expected transactions" ON expected_transactions;
CREATE POLICY "Members can manage expected transactions" ON expected_transactions 
    FOR ALL USING (household_id IN (SELECT get_user_household_ids_v2()));

-- Categories
DROP POLICY IF EXISTS "Users can view household categories" ON categories;
CREATE POLICY "Users can view household categories" ON categories 
    FOR SELECT USING (household_id IS NULL OR household_id IN (SELECT get_user_household_ids_v2()));

DROP POLICY IF EXISTS "Members can manage categories" ON categories;
CREATE POLICY "Members can manage categories" ON categories 
    FOR ALL USING (household_id IN (SELECT get_user_household_ids_v2()));

-- 8. Add comments explaining the fix
COMMENT ON TABLE household_lookups IS 'Lookup table to break RLS recursion for household_members';
COMMENT ON FUNCTION get_user_household_ids_v2 IS 'V2 safe function using household_lookups';
