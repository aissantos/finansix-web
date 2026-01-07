import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores';
import { queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase/client';
import { handleSupabaseError, NotFoundError } from '@/lib/utils/errors';

export interface Subscription {
  id: string;
  household_id: string;
  name: string;
  amount: number;
  billing_day: number;
  credit_card_id?: string;
  category?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Get all subscriptions
export function useSubscriptions() {
  const householdId = useAppStore((s) => s.householdId);

  return useQuery({
    queryKey: ['subscriptions', householdId],
    queryFn: async () => {
      if (!householdId) return [];

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('household_id', householdId)
        .order('name');

      if (error) handleSupabaseError(error);
      return (data ?? []) as Subscription[];
    },
    enabled: !!householdId,
  });
}

// Create subscription
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const householdId = useAppStore((s) => s.householdId);

  return useMutation({
    mutationFn: async (subscription: Omit<Subscription, 'id' | 'household_id' | 'created_at' | 'updated_at'>) => {
      if (!householdId) throw new Error('No household selected');

      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...subscription,
          household_id: householdId,
        })
        .select()
        .single();

      if (error) handleSupabaseError(error);
      if (!data) throw new NotFoundError('Subscription');
      return data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// Update subscription
export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subscription> & { id: string }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) handleSupabaseError(error);
      if (!data) throw new NotFoundError('Subscription');
      return data as Subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// Delete subscription
export function useDeleteSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// Get total monthly subscription cost
export function useSubscriptionTotal() {
  const { data: subscriptions } = useSubscriptions();
  
  const total = subscriptions?.reduce((sum, s) => sum + (s.is_active ? s.amount : 0), 0) ?? 0;
  const count = subscriptions?.filter(s => s.is_active).length ?? 0;
  
  return { total, count };
}
