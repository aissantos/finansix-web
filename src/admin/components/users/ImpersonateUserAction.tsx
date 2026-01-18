import { Eye } from 'lucide-react';
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useImpersonation } from '@/admin/hooks/useImpersonation';
import { useToast } from '@/hooks/useToast';

interface ImpersonateUserActionProps {
  userId: string;
  userName: string;
}

export function ImpersonateUserAction({ userId, userName }: ImpersonateUserActionProps) {
  const { canImpersonate, startImpersonation } = useImpersonation();
  const { toast } = useToast();

  if (!canImpersonate) return null;

  const handleImpersonate = async () => {
    try {
      await startImpersonation.mutateAsync({
        userId,
        reason: `Suporte administrativo para ${userName}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao iniciar impersonation',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  };

  return (
    <DropdownMenuItem onClick={handleImpersonate} disabled={startImpersonation.isPending}>
      <Eye className="h-4 w-4 mr-2" />
      {startImpersonation.isPending ? 'Iniciando...' : 'Impersonar'}
    </DropdownMenuItem>
  );
}
