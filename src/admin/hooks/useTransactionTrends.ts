import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';
import { subDays, format } from 'date-fns';

export interface TransactionTrend {
  date: string;
  count: number;
}

export function useTransactionTrends() {
  return useQuery({
    queryKey: ['transaction-trends'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7);
      
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (error) throw error;
      
      // Group by date
      const grouped = (data || []).reduce((acc, transaction) => {
        const date = format(new Date(transaction.created_at), 'dd/MM');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Generate array for last 7 days
      const trends: TransactionTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateKey = format(date, 'dd/MM');
        trends.push({
          date: dateKey,
          count: grouped[dateKey] || 0,
        });
      }
      
      return trends;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
