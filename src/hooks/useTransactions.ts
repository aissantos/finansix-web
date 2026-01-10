import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getRecentTransactions,
  getTransactionsByCategory,
} from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { useHouseholdId, useSelectedMonth } from '@/stores';
import type { InsertTables, UpdateTables, TransactionWithDetails } from '@/types';

export function useTransactions(options?: {
  month?: Date;
  limit?: number;
  type?: 'income' | 'expense' | 'transfer';
}) {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const month = options?.month ?? selectedMonth;
  const monthKey = format(month, 'yyyy-MM');

  return useQuery({
    queryKey: queryKeys.transactions.list(householdId!, monthKey),
    queryFn: () =>
      getTransactions(householdId!, {
        month,
        limit: options?.limit,
        type: options?.type,
      }),
    enabled: !!householdId,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => getTransaction(id),
    enabled: !!id,
  });
}

export function useRecentTransactions(limit = 10) {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'recent', householdId, limit],
    queryFn: () => getRecentTransactions(householdId!, limit),
    enabled: !!householdId,
  });
}

export function useTransactionsByCategory() {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const monthKey = format(selectedMonth, 'yyyy-MM');

  return useQuery({
    queryKey: queryKeys.transactions.byCategory(householdId!, monthKey),
    queryFn: () => getTransactionsByCategory(householdId!, selectedMonth),
    enabled: !!householdId,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const monthKey = format(selectedMonth, 'yyyy-MM');

  return useMutation({
    mutationFn: (data: Omit<InsertTables<'transactions'>, 'household_id'>) =>
      createTransaction({ ...data, household_id: householdId! }),

    onMutate: async (newTx) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.list(householdId!, monthKey),
      });

      const previous = queryClient.getQueryData<TransactionWithDetails[]>(
        queryKeys.transactions.list(householdId!, monthKey)
      );

      queryClient.setQueryData(
        queryKeys.transactions.list(householdId!, monthKey),
        (old: TransactionWithDetails[] = []) => [
          { ...newTx, id: `temp-${Date.now()}`, household_id: householdId } as TransactionWithDetails,
          ...old,
        ]
      );

      return { previous };
    },

    onError: (_err, _newTx, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.transactions.list(householdId!, monthKey),
          context.previous
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTables<'transactions'> }) =>
      updateTransaction(id, updates),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
    },
  });
}
