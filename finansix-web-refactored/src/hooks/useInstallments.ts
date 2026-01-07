import { useQuery } from '@tanstack/react-query';
import { getInstallmentProjection, getInstallments } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { useHouseholdId } from '@/stores';

export function useInstallmentProjection(months = 12) {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: queryKeys.installments.projection(householdId!, months),
    queryFn: () => getInstallmentProjection(householdId!, months),
    enabled: !!householdId,
  });
}

export function useInstallments(options?: {
  creditCardId?: string;
  status?: 'pending' | 'paid' | 'overdue';
  billingMonth?: Date;
}) {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: queryKeys.installments.list(householdId!, options),
    queryFn: () => getInstallments(householdId!, options),
    enabled: !!householdId,
  });
}
