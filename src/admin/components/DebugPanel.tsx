// Adicione este componente temporário ao dashboard admin para debug
// src/admin/components/DebugPanel.tsx

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthState {
  userId?: string;
  email?: string;
  hasSession: boolean;
}

interface RpcError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  stack?: string;
}

interface AdminCheck {
  isInAdminTable: boolean;
  adminData: unknown;
  error?: string;
}

export function DebugPanel() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [rpcError, setRpcError] = useState<RpcError | null>(null);
  const [adminCheck, setAdminCheck] = useState<AdminCheck | null>(null);

  useEffect(() => {
    async function checkAuth() {
      // 1. Check auth session
      const { data: { session } } = await supabase.auth.getSession();
      setAuthState({
        userId: session?.user?.id,
        email: session?.user?.email,
        hasSession: !!session,
      });

      // 2. Try to call the RPC
      try {
        // @ts-expect-error - get_dashboard_metrics not in generated types yet
        const { error } = await supabase.rpc('get_dashboard_metrics');
        if (error) {
          setRpcError({
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
        }
      } catch (err) {
        const error = err as Error;
        setRpcError({
          message: error.message,
          stack: error.stack,
        });
      }

      // 3. Check if user is in admin_users
      if (session?.user?.id) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setAdminCheck({
          isInAdminTable: !!adminData,
          adminData,
          error: adminError?.message,
        });
      }
    }

    checkAuth();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 max-h-96 overflow-auto z-50">
      <h3 className="font-bold text-lg mb-2">🐛 Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Auth State:</strong>
          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(authState, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Admin Check:</strong>
          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(adminCheck, null, 2)}
          </pre>
        </div>

        <div>
          <strong>RPC Error:</strong>
          <pre className="bg-red-100 dark:bg-red-900 p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(rpcError, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
