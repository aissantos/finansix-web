import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  getFavoriteCategories,
  createCategory,
  toggleFavoriteCategory,
} from '@/lib/supabase';
import { queryKeys } from '@/lib/query-client';
import { useHouseholdId } from '@/stores';
import type { InsertTables, TransactionType } from '@/types';

export function useCategories(type?: TransactionType) {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: queryKeys.categories.list(householdId!, type),
    queryFn: () => getCategories(householdId!, type),
    enabled: !!householdId,
  });
}

export function useFavoriteCategories() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: queryKeys.categories.favorites(householdId!),
    queryFn: () => getFavoriteCategories(householdId!),
    enabled: !!householdId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdId();

  return useMutation({
    mutationFn: (data: Omit<InsertTables<'categories'>, 'household_id'>) =>
      createCategory({ ...data, household_id: householdId! }),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useToggleFavoriteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      toggleFavoriteCategory(id, isFavorite),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
