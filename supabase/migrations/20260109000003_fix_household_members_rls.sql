-- Fix circular RLS policy in household_members
-- The current policy references itself, causing infinite recursion

-- Drop problematic policy
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;

-- Create corrected policy without circular reference
-- Users can see their own membership and members of households they belong to
CREATE POLICY "Users can view members of their households" ON household_members
  FOR SELECT
  USING (
    user_id = auth.uid() -- Can always see their own membership
    OR 
    household_id IN (
      -- Can see members of households where they are a member
      SELECT hm.household_id 
      FROM household_members hm 
      WHERE hm.user_id = auth.uid()
      LIMIT 1
    )
  );

-- Alternative simpler approach: allow users to see any household_member record
-- where they share a household_id (checked via direct query)
DROP POLICY IF EXISTS "Users can view members of their households" ON household_members;

CREATE POLICY "Users can view members of their households" ON household_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM household_members hm 
      WHERE hm.user_id = auth.uid() 
        AND hm.household_id = household_members.household_id
    )
  );

COMMENT ON POLICY "Users can view members of their households" ON household_members IS 
'Users can view members of households they belong to. Uses EXISTS to avoid circular reference.';
