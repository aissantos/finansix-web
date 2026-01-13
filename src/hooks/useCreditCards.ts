import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  getCreditCards,
  getCreditCard,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  getTotalCreditUsage,
} from '@/lib/supabase';
import { getBestCard } from '@/lib/utils/calculations';
import { queryKeys } from '@/lib/query-client';
import { useHouseholdId, useSelectedMonth } from '@/stores';
import type { InsertTables, UpdateTables, CreditCardWithLimits } from '@/types';

export function useCreditCards() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: queryKeys.cards.list(householdId!),
    queryFn: () => getCreditCards(householdId!),
    enabled: !!householdId,
  });
}

export function useCreditCard(id: string) {
  return useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => getCreditCard(id),
    enabled: !!id,
  });
}

export function useCreditUsage() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: queryKeys.cards.usage(householdId!),
    queryFn: () => getTotalCreditUsage(householdId!),
    enabled: !!householdId,
  });
}

export function useBestCard(minimumLimit = 0) {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const monthKey = format(selectedMonth, 'yyyy-MM');

  return useQuery({
    queryKey: [...queryKeys.bestCard(householdId!), minimumLimit, monthKey],
    queryFn: async () => {
      const cards = await getCreditCards(householdId!);
      return getBestCard(cards, selectedMonth, minimumLimit);
    },
    enabled: !!householdId,
  });
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdId();

  return useMutation({
    mutationFn: (data: Omit<InsertTables<'credit_cards'>, 'household_id'>) =>
      createCreditCard({ ...data, household_id: householdId! }),

    onMutate: async (newCard) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.cards.list(householdId!),
      });

      const previous = queryClient.getQueryData<CreditCardWithLimits[]>(
        queryKeys.cards.list(householdId!)
      );

      queryClient.setQueryData(
        queryKeys.cards.list(householdId!),
        (old: CreditCardWithLimits[] = []) => [
          ...old,
          {
            ...newCard,
            id: `temp-${Date.now()}`,
            household_id: householdId,
            available_limit: newCard.credit_limit,
            used_limit: 0,
          } as CreditCardWithLimits,
        ]
      );

      return { previous };
    },

    onError: (_err, _newCard, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.cards.list(householdId!),
          context.previous
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
    },
  });
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTables<'credit_cards'> }) =>
      updateCreditCard(id, data),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
    },
  });
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCreditCard(id),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
    },
  });
}
