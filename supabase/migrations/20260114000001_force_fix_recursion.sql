-- Force Fix infinite recursion in household_members RLS policy

-- 1. Ensure the helper function exists and is SECURITY DEFINER (bypasses RLS)
-- This function allows getting the household_ID without triggering the RLS policy on the table itself recursively
CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_user_household_id() TO authenticated;

-- 2. Drop potential problematic policies (try all likely names)
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;
DROP POLICY IF EXISTS "Users can see their own membership" ON household_members;
DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Member view policy" ON household_members;

-- 3. Create the simplified, safe policy using the security definer function
CREATE POLICY "Users can view members of their households" ON household_members
  FOR SELECT
  USING (
    -- User can see rows if they belong to the same household (checked via safe function)
    household_id = get_user_household_id() 
    OR 
    -- Or if it is their own row (fallback)
    user_id = auth.uid()
  );

COMMENT ON POLICY "Users can view members of their households" ON household_members IS 
'Users can view members of their own household. Uses SECURITY DEFINER function to avoid infinite recursion.';
