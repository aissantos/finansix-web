import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';
import type { Database } from '@/types/database';

type HouseholdMember = Database['public']['Tables']['household_members']['Row'];

export interface UserDetail extends HouseholdMember {
  households?: {
    name: string;
    created_at: string;
  };
  statistics?: {
    totalTransactions: number;
    totalExpenses: number;
    totalIncome: number;
    netBalance: number;
    categoriesUsed: number;
    lastTransactionDate: string | null;
    firstTransactionDate: string | null;
    averageTransactionAmount: number;
  };
}

/**
 * Hook to fetch detailed information about a specific user
 * 
 * @param userId - The user ID to fetch details for
 * 
 * @example
 * const { data: user, isLoading } = useUserDetail('user-id-123');
 */
export function useUserDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-detail', userId],
    queryFn: async (): Promise<UserDetail> => {
      if (!userId) throw new Error('User ID is required');

      // Fetch user basic info with household
      const { data: user, error: userError } = await supabaseAdmin
        .from('household_members')
        .select('*, households(name, created_at)')
        .eq('user_id', userId)
        .single();

      if (userError) throw userError;
      if (!user) throw new Error('User not found');

      // Fetch user statistics via RPC
      // @ts-expect-error - RPC function not in generated types yet
      const { data: stats, error: statsError } = await supabaseAdmin
        .rpc('get_user_statistics', { user_id_param: userId });

      if (statsError) {
        console.error('Error fetching user statistics:', statsError);
      }

      return {
        ...user,
        statistics: stats || {
          totalTransactions: 0,
          totalExpenses: 0,
          totalIncome: 0,
          netBalance: 0,
          categoriesUsed: 0,
          lastTransactionDate: null,
          firstTransactionDate: null,
          averageTransactionAmount: 0,
        },
      };
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch user's recent transactions
 */
export function useUserTransactions(userId: string | undefined, limit: number = 10) {
  return useQuery({
    queryKey: ['user-transactions', userId, limit],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*, categories(name, icon, color)')
        .eq('created_by', userId)
        .eq('deleted_at', null)
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}

/**
 * Hook to fetch user's audit log
 */
export function useUserAuditLog(userId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['user-audit-log', userId, limit],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');

      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('resource_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 30000,
  });
}
