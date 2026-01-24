import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

// Types
type HouseholdMember = Database['public']['Tables']['household_members']['Row'];

export interface UserFilters {
  search?: string;
  household_id?: string;
  role?: string;
  status?: 'active' | 'inactive';
  created_after?: string;
  created_before?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface UsersResponse {
  users: HouseholdMember[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Hook to fetch users with filters and pagination
 * 
 * @example
 * const { data, isLoading } = useUsers(
 *   { search: 'john', household_id: '123' },
 *   { page: 1, pageSize: 20 }
 * );
 */
export function useUsers(filters: UserFilters = {}, pagination: Pagination = { page: 1, pageSize: 20 }) {
  return useQuery({
    queryKey: ['users', filters, pagination],
    queryFn: async (): Promise<UsersResponse> => {
      const { page, pageSize } = pagination;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build query
      let query = supabase
        .from('household_members')
        .select('*, households(name)', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        // Only search in display_name (text field)
        // user_id is UUID and can't use ilike operator
        query = query.ilike('display_name', `%${filters.search}%`);
      }

      if (filters.household_id) {
        query = query.eq('household_id', filters.household_id);
      }

      if (filters.role) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query = query.eq('role', filters.role as any);
      }

      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      // Apply pagination
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        users: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch all households for filter dropdown
 */
export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('households')
        .select('id, name')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      return data;
    },
    staleTime: 60000, // 1 minute
  });
}
