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
  credit_card_id?: string | null;
  category?: string | null;
  icon?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateSubscriptionInput = {
  name: string;
  amount: number;
  billing_day: number;
  credit_card_id?: string | null;
  category?: string | null;
  icon?: string | null;
  is_active?: boolean;
  notes?: string | null;
};

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
    mutationFn: async (input: CreateSubscriptionInput) => {
      if (!householdId) throw new Error('No household selected');

      // Clean up the input - remove undefined/null values for optional fields
      const insertData: Record<string, unknown> = {
        household_id: householdId,
        name: input.name,
        amount: input.amount,
        billing_day: input.billing_day,
        is_active: input.is_active ?? true,
      };

      // Only add optional fields if they have values
      if (input.credit_card_id) {
        insertData.credit_card_id = input.credit_card_id;
      }
      if (input.category) {
        insertData.category = input.category;
      }
      if (input.icon) {
        insertData.icon = input.icon;
      }
      if (input.notes) {
        insertData.notes = input.notes;
      }

      console.log('Creating subscription with data:', insertData);

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        handleSupabaseError(error);
      }
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
      // Clean up updates - remove undefined values
      const cleanUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.amount !== undefined) cleanUpdates.amount = updates.amount;
      if (updates.billing_day !== undefined) cleanUpdates.billing_day = updates.billing_day;
      if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;
      if (updates.credit_card_id !== undefined) cleanUpdates.credit_card_id = updates.credit_card_id || null;
      if (updates.category !== undefined) cleanUpdates.category = updates.category || null;
      if (updates.icon !== undefined) cleanUpdates.icon = updates.icon || null;
      if (updates.notes !== undefined) cleanUpdates.notes = updates.notes || null;

      const { data, error } = await supabase
        .from('subscriptions')
        .update(cleanUpdates)
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
