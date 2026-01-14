-- Fix infinite recursion in household_members RLS policy
-- The previous policy contained a circular reference by querying household_members within the policy itself.
-- We fix this by using the existing `get_user_household_id()` function which is defined as SECURITY DEFINER,
-- allowing it to bypass RLS checks and avoid the loop.

-- 1. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;

-- 2. Create the fixed policy using the SECURITY DEFINER function
CREATE POLICY "Users can view members of their households" ON household_members
  FOR SELECT
  USING (
    -- User can see members if they belong to the same household
    household_id = get_user_household_id()
    -- OR if they are the member themselves (implicitly covered by above if they are in the household, 
    -- but good for edge cases where the function might fail or return null?)
    -- Actually, get_user_household_id returns the ID from the table, so if they are in the table, it returns it.
    
    -- Fallback for safety: Users can always see their own row
    OR user_id = auth.uid()
  );

COMMENT ON POLICY "Users can view members of their households" ON household_members IS 
'Users can view members of their own household. Uses SECURITY DEFINER function to avoid infinite recursion.';
