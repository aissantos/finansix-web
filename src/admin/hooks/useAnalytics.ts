import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  householdId?: string;
}

export interface UserActivityMetrics {
  dau: number;
  wau: number;
  mau: number;
  total_events: number;
}

export interface TransactionAnalytics {
  total_transactions: number;
  total_income: number;
  total_expense: number;
  net_balance: number;
  avg_transaction: number;
  by_category: Array<{
    category_id: string;
    count: number;
    total: number;
    avg: number;
  }>;
  by_type: Array<{
    type: string;
    count: number;
    total: number;
  }>;
  daily_trend: Array<{
    date: string;
    count: number;
    total: number;
  }>;
}

export interface HouseholdGrowthMetrics {
  total_households: number;
  new_households: number;
  active_households: number;
  by_date: Array<{
    date: string;
    count: number;
  }>;
}

export interface CategoryDistribution {
  category_id: string;
  category_name: string;
  category_type: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  percentage: number;
}

/**
 * Hook to fetch user activity metrics (DAU/WAU/MAU)
 */
export function useUserActivityMetrics(date: Date = new Date()) {
  return useQuery({
    queryKey: ['user-activity-metrics', date.toISOString()],
    queryFn: async (): Promise<UserActivityMetrics> => {
      const { data, error } = await supabaseAdmin.rpc('get_user_activity_metrics', {
        p_date: date.toISOString(),
      });

      if (error) throw error;
      return data as UserActivityMetrics;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

/**
 * Hook to fetch transaction analytics
 */
export function useTransactionAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['transaction-analytics', filters],
    queryFn: async (): Promise<TransactionAnalytics> => {
      const { data, error } = await supabaseAdmin.rpc('get_transaction_analytics', {
        p_start_date: filters.startDate,
        p_end_date: filters.endDate,
        p_household_id: filters.householdId || null,
      });

      if (error) throw error;
      return data as TransactionAnalytics;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch household growth metrics
 */
export function useHouseholdGrowthMetrics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['household-growth-metrics', startDate, endDate],
    queryFn: async (): Promise<HouseholdGrowthMetrics> => {
      const { data, error } = await supabaseAdmin.rpc('get_household_growth_metrics', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return data as HouseholdGrowthMetrics;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch category distribution
 */
export function useCategoryDistribution(
  startDate: string,
  endDate: string,
  type?: 'income' | 'expense'
) {
  return useQuery({
    queryKey: ['category-distribution', startDate, endDate, type],
    queryFn: async (): Promise<CategoryDistribution[]> => {
      const { data, error } = await supabaseAdmin.rpc('get_category_distribution', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_type: type || null,
      });

      if (error) throw error;
      return (data as CategoryDistribution[]) || [];
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Combined analytics hook for dashboard
 */
export function useAnalyticsDashboard(filters: AnalyticsFilters) {
  const userActivity = useUserActivityMetrics();
  const transactions = useTransactionAnalytics(filters);
  const householdGrowth = useHouseholdGrowthMetrics(filters.startDate, filters.endDate);
  const categoryDist = useCategoryDistribution(filters.startDate, filters.endDate);

  return {
    userActivity,
    transactions,
    householdGrowth,
    categoryDist,
    isLoading:
      userActivity.isLoading ||
      transactions.isLoading ||
      householdGrowth.isLoading ||
      categoryDist.isLoading,
    error:
      userActivity.error ||
      transactions.error ||
      householdGrowth.error ||
      categoryDist.error,
  };
}
