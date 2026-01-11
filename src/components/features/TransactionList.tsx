import { useNavigate } from 'react-router-dom';
import { useRecentTransactions, useDeleteTransaction } from '@/hooks';
import { SwipeableTransactionItem } from './SwipeableTransactionItem';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/hooks/useToast';
import type { TransactionWithDetails } from '@/types';

interface TransactionListProps {
  limit?: number;
  showTitle?: boolean;
  onViewAll?: () => void;
  showActions?: boolean;
  onEdit?: (transaction: TransactionWithDetails) => void;
  onDelete?: (transaction: TransactionWithDetails) => void;
  enableSwipeGestures?: boolean; // NEW: Enable swipe gestures
}

export function TransactionList({ 
  limit = 10, 
  showTitle = true, 
  onViewAll,
  showActions = true,
  onEdit,
  onDelete,
  enableSwipeGestures = true, // NEW: Default to true (v2.0 feature)
}: TransactionListProps) {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useRecentTransactions(limit);
  const { mutate: deleteTransaction } = useDeleteTransaction();

  const handleEdit = (transaction: TransactionWithDetails) => {
    if (onEdit) {
      onEdit(transaction);
    } else {
      navigate(`/transactions/${transaction.id}/edit`);
    }
  };

  const handleDelete = (transaction: TransactionWithDetails) => {
    if (onDelete) {
      onDelete(transaction);
      return;
    }

    // Confirm deletion
    if (confirm(`Excluir "${transaction.description}"?`)) {
      deleteTransaction(transaction.id, {
        onSuccess: () => {
          toast({
            title: 'Transação excluída',
            description: `${transaction.description} foi removida.`,
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
    }
  };

  const handleDuplicate = (transaction: TransactionWithDetails) => {
    // Navigate to new transaction with prefilled data
    const params = new URLSearchParams({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: `${transaction.description} (cópia)`,
      category_id: transaction.category_id || '',
    });
    navigate(`/transactions/new?${params.toString()}`);
    
    toast({
      title: 'Transação duplicada',
      description: 'Preencha os detalhes e salve.',
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
          <SwipeableTransactionItem 
            key={tx.id} 
            transaction={tx}
            onClick={() => handleEdit(tx)}
            onEdit={showActions && enableSwipeGestures ? () => handleEdit(tx) : undefined}
            onDelete={showActions && enableSwipeGestures ? () => handleDelete(tx) : undefined}
            onDuplicate={enableSwipeGestures ? () => handleDuplicate(tx) : undefined}
          />
        ))}
      </div>
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
