import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin } from '@/admin/lib/supabase-admin';
import { useToast } from '@/hooks/useToast';

export interface Activity {
  id: string;
  timestamp: string;
  admin_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  result: string | null;
  error_message: string | null;
}

export function useActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { toast } = useToast();
  
  // Initial fetch
  const { data, isLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as Activity[];
    },
  });
  
  // Real-time subscription
  useEffect(() => {
    const channel = supabaseAdmin
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          const newActivity = payload.new as Activity;
          setActivities((prev) => [newActivity, ...prev].slice(0, 10));
          
          // Show toast notification for critical activities
          if (['impersonation', 'config_change', 'migration'].includes(newActivity.action)) {
            toast({
              title: getActivityTitle(newActivity.action),
              description: newActivity.metadata?.description as string || 'Nova atividade registrada',
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabaseAdmin.removeChannel(channel);
    };
  }, [toast]);
  
  return {
    activities: activities.length > 0 ? activities : data || [],
    isLoading,
  };
}

function getActivityTitle(action: string): string {
  const titles: Record<string, string> = {
    'impersonation': 'Impersonação Iniciada',
    'config_change': 'Configuração Alterada',
    'migration': 'Migração Executada',
    'rate_limit': 'Rate Limit Atingido',
    'admin_login': 'Admin Login',
  };
  
  return titles[action] || 'Nova Atividade';
}
