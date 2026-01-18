import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase-admin';
import type { Database } from '@/types/database';

export type TransactionWithDetails = Database['public']['Tables']['transactions']['Row'] & {
  users: { name: string; email: string } | null;
  categories: { name: string; icon: string | null } | null;
  households: { name: string } | null;
};

interface UseGlobalTransactionsOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    type?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minValue?: number;
    maxValue?: number;
    search?: string; // Search by description or user email
  };
}

export function useGlobalTransactions({
  page = 1,
  pageSize = 20,
  filters = {},
}: UseGlobalTransactionsOptions = {}) {
  return useQuery({
    queryKey: ['global-transactions', page, pageSize, filters],
    queryFn: async () => {
      let query = supabaseAdmin
        .from('transactions')
        .select(`
          *,
          users:created_by(name:raw_user_meta_data->>display_name, email),
          categories(name, icon),
          households(name)
        `, { count: 'exact' });

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type as Database['public']['Enums']['transaction_type']);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as Database['public']['Enums']['transaction_status']);
      }

      if (filters.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom.toISOString().split('T')[0]);
      }

      if (filters.dateTo) {
        query = query.lte('transaction_date', filters.dateTo.toISOString().split('T')[0]);
      }

      if (filters.minValue !== undefined) {
        query = query.gte('amount', filters.minValue);
      }

      if (filters.maxValue !== undefined) {
        query = query.lte('amount', filters.maxValue);
      }

      if (filters.search) {
        // This is a bit complex without full text search, but let's try basic ILIKE
        // Note: Joining is tricky for filtering on related tables with simple Supabase queries
        // Ideally we'd use a search RPC or search the description directly.
        // For MVP, filter description.
        query = query.ilike('description', `%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('transaction_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data as unknown as TransactionWithDetails[],
        count: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useAggregateStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['aggregate-stats', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .rpc('get_aggregate_stats', {
          start_date: startDate?.toISOString().split('T')[0],
          end_date: endDate?.toISOString().split('T')[0],
        });

      if (error) throw error;
      return data;
    },
  });
}
