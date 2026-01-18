import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';
import { useToast } from '@/hooks/useToast';
import type { Database } from '@/types/database';

type SavedReport = Database['public']['Tables']['saved_reports']['Row'];
type SavedReportInsert = Database['public']['Tables']['saved_reports']['Insert'];
type SavedReportUpdate = Database['public']['Tables']['saved_reports']['Update'];

/**
 * Hook to fetch all saved reports
 */
export function useReports() {
  return useQuery({
    queryKey: ['saved-reports'],
    queryFn: async (): Promise<SavedReport[]> => {
      const { data, error } = await supabaseAdmin
        .from('saved_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single report by ID
 */
export function useReport(reportId: string) {
  return useQuery({
    queryKey: ['saved-report', reportId],
    queryFn: async (): Promise<SavedReport | null> => {
      const { data, error } = await supabaseAdmin
        .from('saved_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!reportId,
  });
}

/**
 * Hook for report mutations (create, update, delete)
 */
export function useReportMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createReport = useMutation({
    mutationFn: async (report: Omit<SavedReportInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabaseAdmin
        .from('saved_reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      toast({
        title: 'Relatório criado',
        description: 'Seu relatório foi salvo com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar relatório',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: SavedReportUpdate;
    }) => {
      const { data, error } = await supabaseAdmin
        .from('saved_reports')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      queryClient.invalidateQueries({ queryKey: ['saved-report', variables.id] });
      toast({
        title: 'Relatório atualizado',
        description: 'Suas alterações foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar relatório',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from('saved_reports').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-reports'] });
      toast({
        title: 'Relatório excluído',
        description: 'O relatório foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir relatório',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });

  return {
    createReport,
    updateReport,
    deleteReport,
  };
}
