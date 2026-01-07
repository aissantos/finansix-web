import { useRecentTransactions } from '@/hooks';
import { TransactionItem } from './TransactionItem';
import { Skeleton } from '@/components/ui/skeleton';

interface TransactionListProps {
  limit?: number;
  showTitle?: boolean;
  onViewAll?: () => void;
}

export function TransactionList({ limit = 10, showTitle = true, onViewAll }: TransactionListProps) {
  const { data: transactions, isLoading } = useRecentTransactions(limit);

  if (isLoading) {
    return <TransactionListSkeleton count={4} showTitle={showTitle} />;
  }

  if (!transactions?.length) {
    return (
      <section>
        {showTitle && (
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Transações
            </h3>
          </div>
        )}
        <div className="text-center py-8 text-slate-500 text-sm">
          Nenhuma transação encontrada
        </div>
      </section>
    );
  }

  return (
    <section>
      {showTitle && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Feed de Transações
          </h3>
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
          <TransactionItem key={tx.id} transaction={tx} />
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
