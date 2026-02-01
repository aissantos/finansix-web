import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteTransactions,
  getTransactionsByCategory,
} from '@/lib/supabase';

import { queryKeys } from '@/lib/query-client';
import { useHouseholdId, useSelectedMonth } from '@/stores';
import type { InsertTables, UpdateTables, TransactionWithDetails } from '@/types';

export function useTransactions(options?: {
  month?: Date;
  limit?: number;
  type?: 'income' | 'expense' | 'transfer';
  creditCardId?: string;
}) {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const month = options?.month ?? selectedMonth;
  const monthKey = format(month, 'yyyy-MM');

  return useQuery({
    queryKey: queryKeys.transactions.list(householdId!, monthKey, options?.creditCardId),
    queryFn: () =>
      getTransactions(householdId!, {
        month,
        limit: options?.limit,
        type: options?.type,
        creditCardId: options?.creditCardId,
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
  const selectedMonth = useSelectedMonth();
  const monthKey = format(selectedMonth, 'yyyy-MM');

  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'recent', householdId, limit, monthKey],
    queryFn: () => getTransactions(householdId!, { 
      limit,
      month: selectedMonth 
    }),
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

import { captureError } from '@/lib/sentry';

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

    onError: (err, _newTransaction, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(
          queryKeys.transactions.list(householdId!, monthKey),
          context.previousTransactions
        );
      }
      captureError(err, { context: 'useCreateTransaction', data: _newTransaction });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTables<'transactions'> }) =>
      updateTransaction(id, data),

    onError: (err, variables) => {
      captureError(err, { context: 'useUpdateTransaction', id: variables.id });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),

    onError: (err, id) => {
      captureError(err, { context: 'useDeleteTransaction', id });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}


export function useDeleteTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => deleteTransactions(ids),

    onError: (err, ids) => {
      captureError(err, { context: 'useDeleteTransactions', ids });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.installments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });
}

/**
 * Hook to fetch ALL transactions without month filter
 * Used in AllTransactionsPage to show complete transaction history
 */
export function useAllTransactions() {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const monthKey = format(selectedMonth, 'yyyy-MM');

  // Used for the "Transactions Page" (Statement View)
  // Filters by selected month AND includes installments for that month
  return useQuery({
    queryKey: [...queryKeys.transactions.all, 'statement', householdId, monthKey],
    queryFn: () => getTransactions(householdId!, {
      month: selectedMonth,
      includeInstallments: true
    }),
    enabled: !!householdId,
  });
}
