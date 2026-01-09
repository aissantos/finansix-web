-- Create RPC function to get user's household_id bypassing RLS
-- This avoids the circular RLS issue in household_members table

CREATE OR REPLACE FUNCTION get_user_household_id()
RETURNS UUID AS $$
  SELECT household_id
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_user_household_id() TO authenticated;

COMMENT ON FUNCTION get_user_household_id() IS 
'Returns the household_id for the current authenticated user. Uses SECURITY DEFINER to bypass RLS.';
