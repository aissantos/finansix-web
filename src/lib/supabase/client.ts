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
// Uses a database RPC function to handle the transaction atomically
export async function getOrCreateHousehold(userId: string, userName?: string): Promise<string> {
  // First, check if user already has a household (fast path)
  const { data: existingMember } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .single();

  if (existingMember?.household_id) {
    return existingMember.household_id;
  }

  // Use RPC function to create household atomically
  // This bypasses RLS chicken-and-egg issues
  const { data: householdId, error } = await supabase
    .rpc('setup_user_household', { user_name: userName });

  if (error) {
    console.error('[Supabase] Error setting up household:', error);
    
    // Fallback: try direct insert if RPC fails (for backwards compatibility)
    const { data: household, error: insertError } = await supabase
      .from('households')
      .insert({ name: userName ? `${userName}'s Family` : 'My Family' })
      .select()
      .single();

    if (insertError || !household) {
      throw new Error(`Failed to create household: ${insertError?.message || 'Unknown error'}`);
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
      console.error('[Supabase] Error adding member:', memberError);
      // Don't throw - household was created, membership might work on retry
    }

    return household.id;
  }

  if (!householdId) {
    throw new Error('Failed to create household: No ID returned');
  }

  return householdId as string;
}
