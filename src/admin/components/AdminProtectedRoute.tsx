import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePermissions } from '@/admin/hooks/usePermissions';

import type { ReactNode } from 'react';

export default function AdminProtectedRoute({ children }: { children?: ReactNode }) {
  const { user, loading } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Verificando permissões...</p>
          </div>
        </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/auth/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
