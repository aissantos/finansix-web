-- Migration: Household Invites and Avatar Storage
-- Adds invite system for multi-tenancy and avatar storage bucket

-- ============================================================================
-- 1. Create household_invites table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.household_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invited_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  
  -- Prevent duplicate pending invites
  UNIQUE(household_id, email, status)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invites_household ON household_invites(household_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON household_invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_status ON household_invites(status);

-- ============================================================================
-- 2. RLS Policies for household_invites
-- ============================================================================

ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- Owners and admins can view invites for their household
CREATE POLICY "Users can view invites for their households"
  ON household_invites FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can create invites
CREATE POLICY "Admins can create invites"
  ON household_invites FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Owners can manage invites (update/delete)
CREATE POLICY "Owners can manage invites"
  ON household_invites FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Invited users can accept their own invites
CREATE POLICY "Users can accept their invites"
  ON household_invites FOR UPDATE
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    status IN ('accepted', 'rejected')
  );

-- ============================================================================
-- 3. Create avatars storage bucket (if not exists)
-- ============================================================================

-- Note: This needs to be run with appropriate permissions
-- In Supabase Dashboard, go to Storage and create a bucket named 'avatars'
-- Or use the SQL below with service_role key

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket for avatar URLs
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. Storage Policies for avatars bucket
-- ============================================================================

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ============================================================================
-- 5. Create receipts storage bucket for transaction attachments
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,  -- Private bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. Storage Policies for receipts bucket
-- ============================================================================

-- Allow household members to upload receipts
CREATE POLICY "Household members can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

-- Allow household members to view receipts (would need RLS on metadata)
CREATE POLICY "Household members can view receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

-- Allow household members to delete their receipts
CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.uid() IS NOT NULL
  );

-- ============================================================================
-- 7. Add attachment_url to transactions table
-- ============================================================================

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- ============================================================================
-- 8. Function to clean expired invites (run via cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION clean_expired_invites()
RETURNS void AS $$
BEGIN
  UPDATE public.household_invites
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. Grant permissions
-- ============================================================================

GRANT ALL ON public.household_invites TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 10. Documentation
-- ============================================================================

COMMENT ON TABLE public.household_invites IS 
'Stores pending invitations for users to join households.
Invites expire after 7 days and can be accepted by users with matching email.';

COMMENT ON COLUMN public.household_invites.role IS 
'Role the invited user will have: admin (can edit/delete) or member (view/add only)';
