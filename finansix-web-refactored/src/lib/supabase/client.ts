import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper to get current user's household_id
export async function getCurrentHouseholdId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  return member?.household_id ?? null;
}

// Helper to get or create household for new users
export async function getOrCreateHousehold(userId: string, userName?: string): Promise<string> {
  // Check if user already has a household
  const { data: existingMember } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single();

  if (existingMember?.household_id) {
    return existingMember.household_id;
  }

  // Create new household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name: userName ? `${userName}'s Family` : 'My Family' })
    .select()
    .single();

  if (householdError || !household) {
    throw new Error('Failed to create household');
  }

  // Add user as owner
  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: userId,
      role: 'owner',
      display_name: userName,
    });

  if (memberError) {
    throw new Error('Failed to add user to household');
  }

  return household.id;
}
