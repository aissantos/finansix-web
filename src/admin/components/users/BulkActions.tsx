import { UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
}

export function BulkActions({ selectedCount, onClearSelection }: BulkActionsProps) {
  if (selectedCount === 0) return null;

  const handleActivate = () => {
    // TODO: Implement bulk activate
  };

  const handleDeactivate = () => {
    // TODO: Implement bulk deactivate
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            {selectedCount} {selectedCount === 1 ? 'usuário selecionado' : 'usuários selecionados'}
          </span>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Limpar seleção
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleActivate}>
            <UserCheck className="h-4 w-4 mr-2" />
            Ativar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeactivate}>
            <UserX className="h-4 w-4 mr-2" />
            Desativar
          </Button>
        </div>
      </div>
    </div>
  );
}
