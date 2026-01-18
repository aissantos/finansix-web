import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase-admin';
import type { Database } from '@/types/database';

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'] & {
  admin?: { email: string; name: string } | null;
};

interface UseAuditLogsOptions {
  page?: number;
  pageSize?: number;
  filters?: {
    action?: string;
    adminId?: string;
    startDate?: Date;
    endDate?: Date;
    resourceType?: string;
  };
}

export function useAuditLogs({
  page = 1,
  pageSize = 20,
  filters = {},
}: UseAuditLogsOptions = {}) {
  return useQuery({
    queryKey: ['audit-logs', page, pageSize, filters],
    queryFn: async () => {
      let query = supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          admin:admin_users(email, name)
        `, { count: 'exact' });

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters.adminId) {
        query = query.eq('admin_id', filters.adminId);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data: data as unknown as AuditLog[],
        count: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      };
    },
    placeholderData: keepPreviousData,
  });
}
