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
import { supabase } from '@/lib/supabase/client';
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
    queryKey: [...queryKeys.transactions.all, 'by-category', householdId, monthKey],
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

    onMutate: async (newTransaction) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions.all });

      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData(
        queryKeys.transactions.list(householdId!, monthKey)
      );

      // Optimistically update
      queryClient.setQueryData(
        queryKeys.transactions.list(householdId!, monthKey),
        (old: TransactionWithDetails[] = []) => [
          {
            ...newTransaction,
            id: 'temp-id',
            household_id: householdId!,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as TransactionWithDetails,
          ...old,
        ]
      );

      return { previousTransactions };
    },

    onError: (_err, _newTransaction, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactions.list(householdId!, monthKey),
          context.previousTransactions
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
    mutationFn: ({ id, data }: { id: string; data: UpdateTables<'transactions'> }) =>
      updateTransaction(id, data),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
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

/**
 * Hook to fetch ALL transactions without month filter
 * Used in AllTransactionsPage to show complete transaction history
 */
export function useAllTransactions() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'complete', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(id, name, icon, color, type),
          credit_card:credit_cards(id, name, last_four_digits, brand, credit_limit),
          account:accounts(id, name, type, current_balance),
          installments:installments(*)
        `)
        .eq('household_id', householdId!)
        .is('deleted_at', null)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as TransactionWithDetails[];
    },
    enabled: !!householdId,
  });
}
