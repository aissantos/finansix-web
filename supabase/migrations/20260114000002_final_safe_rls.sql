-- SAFE RLS RECONSTRUCTION FOR HOUSEHOLD_MEMBERS
-- This script fixes the infinite recursion error (500) caused by policies querying the table itself.

-- 0. PRE-CLEANUP: Drop ALL existing policies (Legacy + New) to allow function updates
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
DROP POLICY IF EXISTS "Users can see their own membership" ON household_members;
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Member view policy" ON household_members;
DROP POLICY IF EXISTS "Owners can manage members" ON household_members;
DROP POLICY IF EXISTS "Users can insert themselves" ON household_members;
DROP POLICY IF EXISTS "Admins can update members" ON household_members;
DROP POLICY IF EXISTS "Admins can delete members" ON household_members;

-- Also drop possibly manually created "Safe" policies that depend on the functions
DROP POLICY IF EXISTS "Safe View Members" ON household_members;
DROP POLICY IF EXISTS "Safe Insert Members" ON household_members;
DROP POLICY IF EXISTS "Safe Update Members" ON household_members;
DROP POLICY IF EXISTS "Safe Delete Members" ON household_members;
DROP POLICY IF EXISTS "Safe Manage Members" ON household_members;

-- 1. Helper Function: Get user's household ID safely (Bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Helper Function: Check if user is owner/admin safely (Bypasses RLS)
DROP FUNCTION IF EXISTS is_household_admin(uuid);
CREATE OR REPLACE FUNCTION is_household_admin(household_id uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM household_members
    WHERE household_id = $1
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_user_household_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_household_admin(uuid) TO authenticated;

-- 4. Re-enable RLS (Safe to do now that we cleaned up)
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- 5. Create New SAFE Policies

-- SELECT: Users can see members if they are in the same household OR it's their own record
CREATE POLICY "Safe View Members" ON household_members
  FOR SELECT
  USING (
    household_id = get_user_household_id() 
    OR 
    user_id = auth.uid()
  );

-- INSERT: Users can add themselves (e.g. accepting invite) OR Admins can add others
CREATE POLICY "Safe Insert Members" ON household_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    is_household_admin(household_id)
  );

-- UPDATE: Admins can update members, OR User can update specific fields of their own (optional, usually restricted)
-- For simplicity and safety, let's limit update to Admins/Owners
CREATE POLICY "Safe Update Members" ON household_members
  FOR UPDATE
  USING (
    is_household_admin(household_id)
  );

-- DELETE: Admins can remove members
CREATE POLICY "Safe Delete Members" ON household_members
  FOR DELETE
  USING (
    is_household_admin(household_id)
  );

COMMENT ON TABLE household_members IS 'Protected by safe anti-recursion RLS policies';
