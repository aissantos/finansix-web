import { useNavigate } from 'react-router-dom';
import { useRecentTransactions } from '@/hooks';
import { TransactionItem } from './TransactionItem';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import type { TransactionWithDetails } from '@/types';

interface TransactionListProps {
  limit?: number;
  showTitle?: boolean;
  onViewAll?: () => void;
  showActions?: boolean;
  onEdit?: (transaction: TransactionWithDetails) => void;
  onDelete?: (transaction: TransactionWithDetails) => void;
}

export function TransactionList({ 
  limit = 10, 
  showTitle = true, 
  onViewAll,
  showActions = true,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useRecentTransactions(limit);

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
    }
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
            onClick={() => handleEdit(tx)}
            onEdit={showActions ? () => handleEdit(tx) : undefined}
            onDelete={showActions ? () => handleDelete(tx) : undefined}
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
