import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/admin/hooks/usePermissions';

export interface ImpersonationSession {
  id: string;
  admin_id: string | null;
  user_id: string | null;
  started_at: string;
  ended_at: string | null;
  timeout_at: string;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;

}

/**
 * Hook for managing user impersonation
 * 
 * @example
 * const { startImpersonation, stopImpersonation, isImpersonating, currentSession } = useImpersonation();
 * 
 * // Start impersonating a user
 * await startImpersonation.mutateAsync({ 
 *   userId: 'user-123', 
 *   reason: 'Customer support request' 
 * });
 * 
 * // Stop impersonation
 * await stopImpersonation.mutateAsync();
 */
export function useImpersonation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { can } = usePermissions();
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Check if user can impersonate
  const canImpersonate = can('IMPERSONATE_USERS');

  // Get active impersonation session
  const { data: currentSession } = useQuery({
    queryKey: ['impersonation-session'],
    queryFn: async (): Promise<ImpersonationSession | null> => {
      const { data, error } = await supabase
        .from('impersonation_sessions')
        .select('*')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setIsImpersonating(true);
      }
      
      return data;
    },
    enabled: canImpersonate,
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Start impersonation mutation
  const startImpersonation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      if (!canImpersonate) {
        throw new Error('Você não tem permissão para impersonar usuários');
      }

      // @ts-expect-error - RPC function not in generated types yet
      const { data, error } = await supabase.rpc('start_impersonation', {
        target_user_id: userId,
        impersonation_reason: reason || null,
        client_ip: null,
        client_user_agent: navigator.userAgent,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsImpersonating(true);
      queryClient.invalidateQueries({ queryKey: ['impersonation-session'] });
      toast({
        title: 'Impersonation iniciada',
        description: 'Você está agora visualizando como este usuário.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar impersonation',
        description: error.message,
      });
    },
  });

  // Stop impersonation mutation
  const stopImpersonation = useMutation({
    mutationFn: async () => {
      if (!currentSession) {
        throw new Error('Nenhuma sessão de impersonation ativa');
      }

      // @ts-expect-error - RPC function not in generated types yet
      const { data, error } = await supabase.rpc('stop_impersonation', {
        session_id_param: currentSession.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setIsImpersonating(false);
      queryClient.invalidateQueries({ queryKey: ['impersonation-session'] });
      toast({
        title: 'Impersonation encerrada',
        description: 'Você voltou à sua conta de administrador.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao encerrar impersonation',
        description: error.message,
      });
    },
  });

  // Calculate remaining time until timeout
  const getRemainingTime = useCallback(() => {
    if (!currentSession) return 0;
    
    const timeoutAt = new Date(currentSession.timeout_at).getTime();
    const now = Date.now();
    const remaining = Math.max(0, timeoutAt - now);
    
    return Math.floor(remaining / 1000); // Return seconds
  }, [currentSession]);

  return {
    isImpersonating,
    currentSession,
    canImpersonate,
    startImpersonation,
    stopImpersonation,
    getRemainingTime,
  };
}
