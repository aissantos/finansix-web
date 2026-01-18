import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserDetail } from '@/admin/hooks/useUserDetail';

interface UserHouseholdInfoProps {
  user: UserDetail;
}

export function UserHouseholdInfo({ user }: UserHouseholdInfoProps) {
  const household = user.households as { name: string; created_at: string } | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Informações do Household
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            Household
          </div>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {household?.name || 'N/A'}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            Função no Household
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <span className="text-slate-900 dark:text-slate-100 capitalize">{user.role}</span>
          </div>
        </div>

        {household?.created_at && (
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              Household criado em
            </div>
            <div className="text-slate-900 dark:text-slate-100">
              {format(new Date(household.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            ID do Household
          </div>
          <div className="font-mono text-sm text-slate-600 dark:text-slate-400">
            {user.household_id}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
