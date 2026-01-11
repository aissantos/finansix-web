import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { calculateFreeBalance } from '@/lib/utils/calculations';
import { queryKeys } from '@/lib/query-client';
import { useHouseholdId, useSelectedMonth } from '@/stores';

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
    queryFn: () => calculateFreeBalance(householdId!, targetDate, includeProjections),
    enabled: !!householdId,
    staleTime: 1000 * 60, // 1 minute
  });
}
