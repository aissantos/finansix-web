import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar,
  Plus,
  CheckSquare,
  Trash2,
  Filter
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { DeleteConfirmDialog } from '@/components/ui';
import { EditTransactionModal } from '@/components/modals/EditTransactionModal';
import { SwipeableTransactionItem } from '@/components/features/SwipeableTransactionItem';
import { 
  useAllTransactions, 
  useCategories, 
  useDeleteTransaction, 
  useUpdateTransaction, 
  useDeleteTransactions,
  useFilteredTransactions 
} from '@/hooks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/useToast';
import type { TransactionWithDetails } from '@/types';
import { 
  CategoryDistributionChart 
} from '@/components/transactions/CategoryDistributionChart';
import { 
  TransactionFilters 
} from '@/components/transactions/TransactionFilters';
import { 
  TransactionMetrics 
} from '@/components/transactions/TransactionMetrics';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export default function AllTransactionsPage() {
  const navigate = useNavigate();
  const deleteMutation = useDeleteTransaction();
  const bulkDeleteMutation = useDeleteTransactions();
  const updateMutation = useUpdateTransaction();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string | null; end: string | null}>({
    start: null,
    end: null
  });
  
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithDetails | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithDetails | null>(null);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const { data: transactions, isLoading } = useAllTransactions();
  const { data: categories } = useCategories();

  // Use Custom Hook for Filtering and Totals
  const { filteredTransactions, totals } = useFilteredTransactions({
    transactions,
    searchQuery,
    filterType,
    selectedCategoryId,
    dateRange
  });

  const handlePay = async (transaction: TransactionWithDetails) => {
    try {
      await updateMutation.mutateAsync({
        id: transaction.id,
        data: { status: 'completed' }
      });
      toast({
        title: 'Conta Paga! 💸',
        description: 'Transação marcada como concluída.',
        variant: 'success',
      });
    } catch (error) {
      console.error('Failed to pay transaction:', error);
      toast({
        title: 'Erro ao pagar',
        description: 'Não foi possível atualizar a transação.',
        variant: 'destructive',
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSelectedCategoryId(null);
    setDateRange({ start: null, end: null });
  };

  const hasActiveFilters = searchQuery || filterType !== 'all' || selectedCategoryId || dateRange.start || dateRange.end;

  // Selection Handlers
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      setIsSelectionMode(true);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredTransactions.map(t => t.id));
      setSelectedIds(allIds);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
      toast({
        title: 'Transações excluídas',
        description: `${selectedIds.size} transações foram removidas com sucesso`,
        variant: 'success',
      });
      setShowBulkDeleteConfirm(false);
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  // Export transactions to CSV
  const exportTransactions = () => {
    const data = filteredTransactions;
    if (data.length === 0) return;

    // CSV Headers
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Parcelas'];
    
    // CSV Rows
    const rows = data.map(t => [
      format(new Date(t.transaction_date), 'dd/MM/yyyy'),
      t.description,
      t.category?.name || 'Sem categoria',
      t.type === 'income' ? 'Receita' : 'Despesa',
      `R$ ${t.amount.toFixed(2).replace('.', ',')}`,
      t.status,
      t.is_installment ? `${t.total_installments}x` : '-'
    ]);

    // Build CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finansix-transacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteMutation.mutateAsync(deletingTransaction.id);
      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso',
        variant: 'success',
      });
      setDeletingTransaction(null);
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Todas Transações" showBack onBack={() => navigate(-1)} />
        <PageContainer className="space-y-4 pt-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Todas Transações" showBack onBack={() => navigate(-1)} showMonthSelector />
      <PageContainer className="space-y-4 pt-6 pb-24">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 pb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar transações..."
                className="pl-10 pr-2 pt-2 pb-2 h-10"
              />
            </div>
            
            <Button
                variant={isSelectionMode ? "default" : "outline"}
                size="icon"
                onClick={toggleSelectionMode}
                className={cn(
                    "h-10 w-10 flex-shrink-0",
                    isSelectionMode && "bg-blue-600 hover:bg-blue-700 text-white"
                )}
                title="Seleção Múltipla"
            >
                {isSelectionMode ? <CheckSquare className="h-4 w-4" /> : <CheckSquare className="h-4 w-4 text-slate-500" />}
            </Button>
            
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                  "h-10 w-10 flex-shrink-0",
                  hasActiveFilters && "bg-primary text-white"
              )}
            >
               <Filter className={cn("h-4 w-4", !hasActiveFilters && "text-slate-500")} />
               {hasActiveFilters && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
               )}
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <TransactionFilters
            filterType={filterType}
            setFilterType={setFilterType}
            selectedCategoryId={selectedCategoryId}
            setSelectedCategoryId={setSelectedCategoryId}
            dateRange={dateRange}
            setDateRange={setDateRange}
            categories={categories}
            onClearFilters={clearFilters}
            onExport={exportTransactions}
            hasResults={filteredTransactions.length > 0}
            hasActiveFilters={!!hasActiveFilters}
          />
        )}

        {/* Selection Actions Header */}
        {isSelectionMode && (
             <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900 mb-2">
                 <div className="flex items-center gap-2">
                     <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                         {selectedIds.size} selecionados
                     </span>
                 </div>
                 <div className="flex gap-2">
                     <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={selectAll}
                         className="h-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                     >
                         {selectedIds.size === filteredTransactions.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                     </Button>
                 </div>
             </div>
        )}

        {/* Totals Summary */}
        {filteredTransactions.length > 0 && !isSelectionMode && (
            <TransactionMetrics totals={totals} />
        )}

        {/* Category Distribution Chart */}
        {filteredTransactions.length > 0 && !isSelectionMode && (
             <CategoryDistributionChart transactions={filteredTransactions} />
        )}

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-12 w-12" />}
            title="Nenhuma transação encontrada"
            description={hasActiveFilters 
              ? "Tente ajustar os filtros para ver mais resultados"
              : "Você ainda não tem transações cadastradas"
            }
            action={{
              label: "Nova Transação",
              onClick: () => navigate('/transactions/new'),
              icon: <Plus className="h-4 w-4" />
            }}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Histórico
                </p>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">
                    {filteredTransactions.length} itens
                </span>
            </div>
           
            <div className="flex flex-col gap-3">
              {filteredTransactions.map((transaction) => (
                <SwipeableTransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => setEditingTransaction(transaction)}
                  onEdit={() => setEditingTransaction(transaction)}
                  onDelete={() => setDeletingTransaction(transaction)}
                  onPay={() => handlePay(transaction)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(transaction.id)}
                  onToggleSelection={() => toggleSelection(transaction.id)}
                />
              ))}
            </div>
          </div>
        )}
      </PageContainer>

      {/* Floating Bulk Action Bar */}
      {isSelectionMode && selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-200">
              <Card className="p-3 shadow-xl bg-slate-900 border-slate-800 flex items-center justify-between text-white">
                  <div className="pl-2">
                       <span className="font-bold">{selectedIds.size}</span>
                       <span className="text-slate-400 text-sm ml-1">selecionados</span>
                  </div>
                  <Button 
                      variant="destructive" 
                      onClick={() => setShowBulkDeleteConfirm(true)}
                  >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                  </Button>
              </Card>
          </div>
      )}

      {/* Modals */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteConfirm}
        entityName="esta transação"
        isLoading={deleteMutation.isPending}
      />

      <DeleteConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        entityName="as transações selecionadas"
        isLoading={bulkDeleteMutation.isPending}
        title={`Excluir ${selectedIds.size} transações?`}
        description="Esta ação não poderá ser desfeita. Todas as transações selecionadas serão removidas permanentemente."
      />
    </>
  );
}
