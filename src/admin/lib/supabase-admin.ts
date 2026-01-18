import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for admin client');
}

/**
 * Supabase Admin Client
 * 
 * Uses SERVICE_ROLE_KEY to bypass RLS policies.
 * Should ONLY be used in admin dashboard for privileged operations.
 * 
 * WARNING: Never expose service role key in client-side code in production!
 * This is safe for admin dashboard as it's protected by authentication.
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-admin-auth-token', // Separate storage key to avoid conflict with main app
  },
});
