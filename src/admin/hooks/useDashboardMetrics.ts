import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';

export interface DashboardMetrics {
  activeUsers: {
    value: number;
    delta: number;
  };
  transactionsToday: {
    value: number;
    delta: number;
  };
  errorRate: {
    value: number;
    delta: number;
  };
  systemHealth: {
    value: number;
    incidents: number;
  };
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      // @ts-expect-error - get_dashboard_metrics not yet in generated types
      const { data, error } = await supabaseAdmin.rpc('get_dashboard_metrics');
      
      if (error) throw error;
      return data as unknown as DashboardMetrics;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 25000, // Consider data stale after 25s
  });
}
