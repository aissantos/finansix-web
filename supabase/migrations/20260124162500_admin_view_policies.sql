-- ============================================================================
-- Migration: Add Admin Policies for User Data Access
-- Date: 2026-01-24
-- Purpose: Allow admins to view all users, households, and transactions
-- ============================================================================

-- ============================================================================
-- 1. HOUSEHOLD_MEMBERS - Admin can view all members
-- ============================================================================

CREATE POLICY "Admins can view all household_members"
ON household_members FOR SELECT
USING (is_admin());

COMMENT ON POLICY "Admins can view all household_members" ON household_members IS
'Allows admins to view all household members for admin panel';

-- ============================================================================
-- 2. HOUSEHOLDS - Admin can view all households
-- ============================================================================

CREATE POLICY "Admins can view all households"
ON households FOR SELECT
USING (is_admin());

COMMENT ON POLICY "Admins can view all households" ON households IS
'Allows admins to view all households for admin panel';

-- ============================================================================
-- 3. TRANSACTIONS - Admin can view all transactions
-- ============================================================================

CREATE POLICY "Admins can view all transactions"
ON transactions FOR SELECT
USING (is_admin());

COMMENT ON POLICY "Admins can view all transactions" ON transactions IS
'Allows admins to view all transactions for admin panel analytics';

-- ============================================================================
-- 4. INSTALLMENTS - Admin can view all installments
-- ============================================================================

CREATE POLICY "Admins can view all installments"
ON installments FOR SELECT
USING (is_admin());

COMMENT ON POLICY "Admins can view all installments" ON installments IS
'Allows admins to view all installments for admin panel';

-- ============================================================================
-- 5. ACCOUNTS - Admin can view all accounts
-- ============================================================================

CREATE POLICY "Admins can view all accounts"
ON accounts FOR SELECT
USING (is_admin());

COMMENT ON POLICY "Admins can view all accounts" ON accounts IS
'Allows admins to view all accounts for admin panel';

-- ============================================================================
-- 6. CREDIT_CARDS - Admin can view all credit cards
-- ============================================================================

CREATE POLICY "Admins can view all credit_cards"
ON credit_cards FOR SELECT
USING (is_admin());

COMMENT ON POLICY "Admins can view all credit_cards" ON credit_cards IS
'Allows admins to view all credit cards for admin panel';

-- ============================================================================
-- 7. CATEGORIES - Admin can view all categories
-- ============================================================================

CREATE POLICY "Admins can view all categories"
ON categories FOR SELECT
USING (is_admin());

COMMENT ON POLICY "Admins can view all categories" ON categories IS
'Allows admins to view all categories for admin panel';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify policies were created
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE policyname LIKE '%Admins can view%'
-- ORDER BY tablename;
