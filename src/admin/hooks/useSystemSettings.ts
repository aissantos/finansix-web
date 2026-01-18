import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '../lib/supabase-admin';
import type { Database } from '@/types/database';

export type SystemSetting = Database['public']['Tables']['system_settings']['Row'];
export type SystemSettingUpdate = Database['public']['Tables']['system_settings']['Update'];

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .select('*')
        .order('group', { ascending: true })
        .order('key', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Database['public']['Tables']['system_settings']['Row']['value'] }) => {
      const { data, error } = await supabaseAdmin
        .from('system_settings')
        .update({ value })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}
