import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDeleteTransaction } from '@/hooks';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from '@/components/ui/empty-state';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/hooks/useToast';
import type { TransactionWithDetails } from '@/types';

interface VirtualizedTransactionListProps {
  transactions: TransactionWithDetails[];
  showActions?: boolean;
  estimatedItemHeight?: number;
  maxHeight?: string;
}

/**
 * Virtualized transaction list for optimal performance with 100+ items
 * Only renders visible items + overscan buffer
 */
export function VirtualizedTransactionList({ 
  transactions, 
  showActions = true,
  estimatedItemHeight = 72,
  maxHeight = '600px',
}: VirtualizedTransactionListProps) {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);
  const { mutate: deleteTransaction } = useDeleteTransaction();
  const { confirm, Dialog } = useConfirmDialog();

  // Virtualization
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan: 5, // Render 5 extra items above/below viewport
  });

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

  if (!transactions.length) {
    return (
      <EmptyState 
        variant="transactions" 
        action={{
          label: 'Adicionar Transação',
          onClick: () => navigate('/transactions/new'),
        }}
      />
    );
  }

  return (
    <>
      <div 
        ref={parentRef} 
        style={{ height: maxHeight, overflow: 'auto' }}
        className="rounded-xl"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const transaction = transactions[virtualRow.index];
            
            return (
              <div
                key={transaction.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="pb-3" // Gap between items
              >
                <TransactionItem 
                  transaction={transaction}
                  onClick={() => handleEdit(transaction.id)}
                  onEdit={showActions ? () => handleEdit(transaction.id) : undefined}
                  onDelete={showActions ? () => handleDelete(transaction.id, transaction.description) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {Dialog}
    </>
  );
}

// Export helper to decide which component to use
export function useVirtualizedList(itemCount: number, threshold = 50) {
  return itemCount > threshold;
}
