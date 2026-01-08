import { useNavigate } from 'react-router-dom';
import { useRecentTransactions, useDeleteTransaction } from '@/hooks';
import { TransactionItem } from './TransactionItem';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/hooks/useToast';

interface TransactionListProps {
  limit?: number;
  showTitle?: boolean;
  onViewAll?: () => void;
  showActions?: boolean;
}

export function TransactionList({ 
  limit = 10, 
  showTitle = true, 
  onViewAll,
  showActions = true,
}: TransactionListProps) {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useRecentTransactions(limit);
  const { mutate: deleteTransaction } = useDeleteTransaction();
  const { confirm, Dialog } = useConfirmDialog();

  const handleEdit = (id: string) => {
    navigate(`/transactions/${id}/edit`);
  };

  const handleDelete = (id: string, description: string) => {
    confirm({
      title: 'Excluir transação?',
      description: `Tem certeza que deseja excluir "${description}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: () => {
        deleteTransaction(id, {
          onSuccess: () => {
            toast({
              title: 'Transação excluída',
              description: 'A transação foi removida com sucesso.',
              variant: 'success',
            });
          },
          onError: () => {
            toast({
              title: 'Erro ao excluir',
              description: 'Tente novamente.',
              variant: 'destructive',
            });
          },
        });
      },
    });
  };

  if (isLoading) {
    return <TransactionListSkeleton count={4} showTitle={showTitle} />;
  }

  if (!transactions?.length) {
    return (
      <section>
        {showTitle && (
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="section-title">Transações</h3>
          </div>
        )}
        <EmptyState 
          variant="transactions" 
          action={{
            label: 'Adicionar Transação',
            onClick: () => navigate('/transactions/new'),
          }}
        />
      </section>
    );
  }

  return (
    <section>
      {showTitle && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="section-title">Feed de Transações</h3>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs text-primary font-bold hover:underline"
            >
              Ver extrato completo
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {transactions.map((tx) => (
          <TransactionItem 
            key={tx.id} 
            transaction={tx}
            onClick={() => handleEdit(tx.id)}
            onEdit={showActions ? () => handleEdit(tx.id) : undefined}
            onDelete={showActions ? () => handleDelete(tx.id, tx.description) : undefined}
          />
        ))}
      </div>
      
      {Dialog}
    </section>
  );
}

function TransactionListSkeleton({ count = 4, showTitle = true }: { count?: number; showTitle?: boolean }) {
  return (
    <section>
      {showTitle && (
        <div className="flex items-center justify-between mb-3 px-1">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      )}
      <div className="flex flex-col gap-3">
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
