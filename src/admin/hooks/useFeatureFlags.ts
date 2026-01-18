import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase-admin';
import type { Database } from '@/types/database';

export type FeatureFlag = Database['public']['Tables']['feature_flags']['Row'];
type UpdateFlagParams = {
    id: string;
    isEnabled?: boolean;
    rolloutPercentage?: number | null;
    targetSegment?: string | null;
};

export function useFeatureFlags() {
    const queryClient = useQueryClient();

    const { data: flags, isLoading, error } = useQuery({
        queryKey: ['feature-flags'],
        queryFn: async () => {
            const { data, error } = await supabaseAdmin
                .from('feature_flags')
                .select('*')
                .order('name');
            
            if (error) throw error;
            return data;
        },
    });

    const { mutate: updateFlag, isPending: isUpdating } = useMutation({
        mutationFn: async ({ id, isEnabled, rolloutPercentage, targetSegment }: UpdateFlagParams) => {
            const updates: Partial<FeatureFlag> = { updated_at: new Date().toISOString() };
            
            if (isEnabled !== undefined) updates.is_enabled = isEnabled;
            if (rolloutPercentage !== undefined) updates.rollout_percentage = rolloutPercentage;
            if (targetSegment !== undefined) updates.target_segment = targetSegment;

            const { error } = await supabaseAdmin
                .from('feature_flags')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
        },
    });

    return {
        flags,
        isLoading,
        error,
        updateFlag,
        isUpdating
    };
}
