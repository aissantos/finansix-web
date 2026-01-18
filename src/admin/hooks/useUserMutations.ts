import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';
import { useToast } from '@/hooks/useToast';
import type { Database } from '@/types/database';

type HouseholdMember = Database['public']['Tables']['household_members']['Row'];
type HouseholdMemberInsert = Database['public']['Tables']['household_members']['Insert'];
type HouseholdMemberUpdate = Database['public']['Tables']['household_members']['Update'];

/**
 * Hook for user mutations (create, update, delete)
 */
export function useUserMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (data: HouseholdMemberInsert) => {
      const { data: newUser, error } = await supabaseAdmin
        .from('household_members')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário criado',
        description: 'O usuário foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar usuário',
        description: error.message,
      });
    },
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: HouseholdMemberUpdate }) => {
      const { data: updatedUser, error } = await supabaseAdmin
        .from('household_members')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedUser;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail', variables.id] });
      toast({
        title: 'Usuário atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar usuário',
        description: error.message,
      });
    },
  });

  // Delete user mutation (soft delete)
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Note: We don't actually delete from household_members
      // Instead, we could deactivate or remove from household
      // For now, this is a placeholder
      throw new Error('Delete user not implemented - use deactivate instead');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário removido',
        description: 'O usuário foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover usuário',
        description: error.message,
      });
    },
  });

  // Bulk activate/deactivate users
  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ userIds, status }: { userIds: string[]; status: 'active' | 'inactive' }) => {
      // Note: household_members doesn't have a status field
      // This would need to be implemented based on your schema
      // Placeholder for now
      throw new Error('Bulk status update not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Status atualizado',
        description: 'O status dos usuários foi atualizado.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: error.message,
      });
    },
  });

  return {
    createUser,
    updateUser,
    deleteUser,
    bulkUpdateStatus,
  };
}
