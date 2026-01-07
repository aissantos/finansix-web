-- Migration: Setup New User Function
-- This function creates a household and adds the user as owner in a single transaction
-- Bypasses RLS issues during initial user setup

-- ============================================================================
-- 1. Create the setup function in _secured schema
-- ============================================================================

CREATE OR REPLACE FUNCTION _secured.setup_new_user(
  p_user_id UUID,
  p_user_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_household_id UUID;
  v_existing_household_id UUID;
BEGIN
  -- Check if user already has a household
  SELECT household_id INTO v_existing_household_id
  FROM public.household_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_existing_household_id IS NOT NULL THEN
    RETURN v_existing_household_id;
  END IF;

  -- Create new household
  INSERT INTO public.households (name)
  VALUES (COALESCE(p_user_name || '''s Family', 'My Family'))
  RETURNING id INTO v_household_id;

  -- Add user as owner
  INSERT INTO public.household_members (household_id, user_id, role, display_name)
  VALUES (v_household_id, p_user_id, 'owner', p_user_name);

  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION _secured.setup_new_user(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 2. Create a public wrapper that can be called via RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.setup_user_household(
  user_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
BEGIN
  -- Call the secured function with the current user's ID
  RETURN _secured.setup_new_user(auth.uid(), user_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.setup_user_household(TEXT) TO authenticated;

-- ============================================================================
-- 3. Documentation
-- ============================================================================
COMMENT ON FUNCTION _secured.setup_new_user(UUID, TEXT) IS 
'Creates a household for a new user and adds them as owner.
Called during initial user setup. Returns existing household_id if user already has one.';

COMMENT ON FUNCTION public.setup_user_household(TEXT) IS 
'Public RPC function to set up a new user''s household.
Calls _secured.setup_new_user with the authenticated user''s ID.';
