import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getInstallmentProjection, getInstallments } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { useHouseholdId, useSelectedMonth } from '@/stores';

export function useInstallmentProjection(months = 12) {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const monthKey = format(selectedMonth, 'yyyy-MM');

  return useQuery({
    queryKey: [...queryKeys.installments.projection(householdId!, months), monthKey],
    queryFn: () => getInstallmentProjection(householdId!, months, selectedMonth),
    enabled: !!householdId,
  });
}

export function useInstallments(options?: {
  creditCardId?: string;
  status?: 'pending' | 'paid' | 'overdue';
  billingMonth?: Date;
  useSelectedMonth?: boolean; // ← New option to control behavior
}) {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  
  // Only use selectedMonth if explicitly requested or if no creditCardId is provided
  const shouldUseSelectedMonth = options?.useSelectedMonth ?? (!options?.creditCardId && !options?.billingMonth);
  
  const effectiveOptions = {
    creditCardId: options?.creditCardId,
    status: options?.status,
    billingMonth: options?.billingMonth ?? (shouldUseSelectedMonth ? selectedMonth : undefined),
  };

  return useQuery({
    queryKey: queryKeys.installments.list(householdId!, effectiveOptions),
    queryFn: () => getInstallments(householdId!, effectiveOptions),
    enabled: !!householdId,
  });
}
