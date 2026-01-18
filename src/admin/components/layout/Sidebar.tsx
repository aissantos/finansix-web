import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  ShieldAlert, 
  Settings, 
  FileText,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/admin/hooks/usePermissions';

export function AdminSidebar() {
  const location = useLocation();
  const { can } = usePermissions();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      current: location.pathname === '/admin',
      permission: 'VIEW_DASHBOARD' as const,
    },
    {
      name: 'Usuários',
      href: '/admin/users',
      icon: Users,
      current: location.pathname.startsWith('/admin/users'),
      permission: 'VIEW_USERS' as const,
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: location.pathname.startsWith('/admin/analytics'),
      permission: 'VIEW_DASHBOARD' as const,
    },
    {
      name: 'Auditoria',
      href: '/admin/audit',
      icon: ShieldAlert,
      current: location.pathname.startsWith('/admin/audit'),
      permission: 'VIEW_AUDIT_LOG' as const,
    },
    {
      name: 'Sistema',
      href: '/admin/system',
      icon: Activity,
      current: location.pathname.startsWith('/admin/system'),
      permission: 'VIEW_SYSTEM_HEALTH' as const,
    },
    {
        name: 'Relatórios',
        href: '/admin/reports',
        icon: FileText,
        current: location.pathname.startsWith('/admin/reports'),
        permission: 'VIEW_DASHBOARD' as const, // Placeholder permission
    },
    {
      name: 'Configurações',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname.startsWith('/admin/settings'),
      permission: 'MANAGE_ADMINS' as const,
    },
  ];

  return (
    <div className="flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50">Finansix Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
            if (!can(item.permission)) return null;
            
            return (
                <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    item.current
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                </Link>
            );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="px-3 py-2">
            <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Versão 2.0.0</p>
            <p className="text-xs text-slate-400">Environment: {import.meta.env.MODE}</p>
        </div>
      </div>
    </div>
  );
}
