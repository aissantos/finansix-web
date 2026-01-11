import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth } from 'date-fns';
import { calculateFreeBalance, type FreeBalanceInput } from '@/lib/utils/calculations';
import { queryKeys } from '@/lib/query-client';
import { useHouseholdId, useSelectedMonth } from '@/stores';
import { supabase } from '@/lib/supabase/client';

/**
 * Fetches all data required for free balance calculation
 * This separates data fetching (side effect) from pure calculation logic
 */
async function fetchFreeBalanceData(
  householdId: string,
  targetDate: Date,
  includeProjections: boolean
): Promise<FreeBalanceInput> {
  const today = startOfMonth(new Date());
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');

  // Parallel fetching for better performance
  const [
    accountsResult,
    pendingTxResult,
    installmentsResult,
    expectationsResult,
    reimbursementsResult,
  ] = await Promise.all([
    // 1. Current balance from all accounts
    supabase
      .from('accounts')
      .select('current_balance')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .is('deleted_at', null),

    // 2. Pending expenses (not on credit card)
    supabase
      .from('transactions')
      .select('amount')
      .eq('household_id', householdId)
      .eq('type', 'expense')
      .eq('status', 'pending')
      .is('credit_card_id', null)
      .lte('transaction_date', targetDateStr)
      .is('deleted_at', null),

    // 3. Credit card due (pending installments until target date)
    supabase
      .from('installments')
      .select('amount')
      .eq('household_id', householdId)
      .eq('status', 'pending')
      .lte('due_date', targetDateStr)
      .is('deleted_at', null),

    // 4 & 5. Expected income and expenses (if projections enabled)
    includeProjections
      ? supabase
          .from('expected_transactions')
          .select('amount, confidence_percent, type')
          .eq('household_id', householdId)
          .eq('is_active', true)
          .lte('start_date', targetDateStr)
          .or(`end_date.is.null,end_date.gte.${format(today, 'yyyy-MM-dd')}`)
      : Promise.resolve({ data: null }),

    // 6. Pending reimbursements
    supabase
      .from('transactions')
      .select('amount, reimbursed_amount')
      .eq('household_id', householdId)
      .eq('is_reimbursable', true)
      .in('reimbursement_status', ['pending', 'partial'])
      .is('deleted_at', null),
  ]);

  return {
    accounts: accountsResult.data ?? [],
    pendingTransactions: pendingTxResult.data ?? [],
    pendingInstallments: installmentsResult.data ?? [],
    expectedTransactions: expectationsResult.data as FreeBalanceInput['expectedTransactions'],
    reimbursableTransactions: reimbursementsResult.data ?? [],
  };
}

export function useFreeBalance(options?: {
  targetDate?: Date;
  includeProjections?: boolean;
}) {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const targetDate = options?.targetDate ?? selectedMonth;
  const monthKey = format(targetDate, 'yyyy-MM');
  const includeProjections = options?.includeProjections ?? true;

  return useQuery({
    queryKey: queryKeys.freeBalance(householdId!, monthKey),
    queryFn: async () => {
      // Step 1: Fetch data (side effect - handled by React Query)
      const data = await fetchFreeBalanceData(householdId!, targetDate, includeProjections);
      
      // Step 2: Calculate (pure function - easily testable)
      return calculateFreeBalance(data, includeProjections);
    },
    enabled: !!householdId,
    staleTime: 1000 * 60, // 1 minute
  });
}
