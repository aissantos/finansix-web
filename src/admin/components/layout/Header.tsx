import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/admin/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { DropdownMenu } from '@/components/ui/dropdown-menu';

import { AdminCommandPalette } from '@/admin/components/AdminCommandPalette';

export function AdminHeader() {
  const navigate = useNavigate();
  const { user } = usePermissions();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/auth/login');
  };

  const menuItems = [
      {
          label: 'Perfil',
          onClick: () => { /* TODO: Navigate to profile */ }
      },
      {
          label: 'Configurações',
          onClick: () => navigate('/admin/settings')
      },
      {
          label: 'Sair',
          onClick: handleSignOut,
          variant: 'danger' as const,
          icon: <LogOut className="h-4 w-4" />
      }
  ];

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex items-center text-sm text-slate-500 w-1/3">
         <span className="font-medium text-slate-900 dark:text-slate-100 hidden sm:inline-block">Painel de Controle</span>
      </div>

      <div className="flex-1 flex justify-center">
        <AdminCommandPalette />
      </div>

      <div className="flex items-center justify-end gap-4 w-1/3">
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            
            <DropdownMenu
                trigger={
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 p-0 overflow-hidden hover:opacity-90 transition-opacity">
                         <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    </Button>
                }
                items={menuItems}
                position="bottom-right"
            />
        </div>
      </div>
    </header>
  );
}
