import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getTotalBalance,
} from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { useHouseholdId } from '@/stores';
import type { InsertTables, UpdateTables, Account } from '@/types';

export function useAccounts() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: queryKeys.accounts.list(householdId!),
    queryFn: () => getAccounts(householdId!),
    enabled: !!householdId,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: () => getAccount(id),
    enabled: !!id,
  });
}

export function useTotalBalance() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: queryKeys.accounts.totalBalance(householdId!),
    queryFn: () => getTotalBalance(householdId!),
    enabled: !!householdId,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdId();

  return useMutation({
    mutationFn: (data: Omit<InsertTables<'accounts'>, 'household_id'>) =>
      createAccount({ ...data, household_id: householdId! }),

    onMutate: async (newAccount) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.accounts.list(householdId!),
      });

      const previous = queryClient.getQueryData<Account[]>(
        queryKeys.accounts.list(householdId!)
      );

      queryClient.setQueryData(
        queryKeys.accounts.list(householdId!),
        (old: Account[] = []) => [
          ...old,
          {
            ...newAccount,
            id: `temp-${Date.now()}`,
            household_id: householdId,
            current_balance: newAccount.initial_balance ?? 0,
          } as Account,
        ]
      );

      return { previous };
    },

    onError: (_err, _newAccount, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.accounts.list(householdId!),
          context.previous
        );
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTables<'accounts'> }) =>
      updateAccount(id, data),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
      queryClient.invalidateQueries({ queryKey: ['freeBalance'] });
    },
  });
}
