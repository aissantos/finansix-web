import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type SystemSetting = Database['public']['Tables']['system_settings']['Row'];

interface SystemConfigContextType {
  settings: SystemSetting[];
  isLoading: boolean;
  getFlag: <T = unknown>(key: string, defaultValue?: T) => T;
  isEnabled: (key: string) => boolean;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export function SystemConfigProvider({ children }: { children: ReactNode }) {
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['public-system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      
      if (error) {
        console.error('Failed to load system settings:', error);
        return [];
      }
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getFlag = <T = unknown>(key: string, defaultValue: T = null as T): T => {
    const setting = settings.find(s => s.key === key);
    return (setting ? setting.value : defaultValue) as T;
  };

  const isEnabled = (key: string) => {
    const val = getFlag<unknown>(key, false);
    return val === true || val === 'true';
  };

  return (
    <SystemConfigContext.Provider value={{ settings, isLoading, getFlag, isEnabled }}>
      {children}
    </SystemConfigContext.Provider>
  );
}

export function useSystemConfig() {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
}
