/**
 * ALL TRANSACTIONS PAGE
 * 
 * Página dedicada para visualização de todas transações
 * com filtros por tipo, categoria, período, etc.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Filter, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  X,
  Plus,
  PieChart,
  Repeat,
  Wallet,
  CheckSquare,
  Trash2
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { DeleteConfirmDialog } from '@/components/ui';
import { EditTransactionModal } from '@/components/modals/EditTransactionModal';
import { SwipeableTransactionItem } from '@/components/features/SwipeableTransactionItem';
import { useAllTransactions, useCategories, useDeleteTransaction, useUpdateTransaction, useDeleteTransactions } from '@/hooks';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/useToast';
import type { TransactionWithDetails } from '@/types';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

// Category Distribution Chart Component
function CategoryDistributionChart({ transactions }: { transactions: TransactionWithDetails[] }) {
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, { name: string; amount: number; color: string; count: number }>();
    
    transactions
      .filter(t => t.type === 'expense') // Only expenses for distribution
      .forEach(t => {
        const catId = t.category_id || 'uncategorized';
        const catName = t.category?.name || 'Sem categoria';
        const catColor = t.category?.color || '#94a3b8';
        
        if (totals.has(catId)) {
          const existing = totals.get(catId)!;
          existing.amount += t.amount;
          existing.count += 1;
        } else {
          totals.set(catId, {
            name: catName,
            amount: t.amount,
            color: catColor,
            count: 1
          });
        }
      });

    return Array.from(totals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
  }, [transactions]);

  const totalExpenses = categoryTotals.reduce((sum, cat) => sum + cat.amount, 0);

  if (categoryTotals.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Distribuição por Categoria
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Top 5 despesas
          </p>
        </div>
        <PieChart className="h-5 w-5 text-slate-400" />
      </div>

      <div className="space-y-3">
        {categoryTotals.map((cat, index) => {
          const percentage = (cat.amount / totalExpenses) * 100;
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({cat.count})
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-shrink-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: cat.color 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

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

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category?.name.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(t => t.category_id === selectedCategoryId);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(t => 
        new Date(t.transaction_date) >= new Date(dateRange.start!)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => 
        new Date(t.transaction_date) <= new Date(dateRange.end!)
      );
    }

    return filtered;
  }, [transactions, searchQuery, filterType, selectedCategoryId, dateRange]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

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
      // Exit selection mode
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      // Enter selection mode
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
  const exportTransactions = (data: typeof filteredTransactions) => {
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
          <Card className="p-4 space-y-4">
            {/* Type Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Tipo
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'all' as const, label: 'Todas', icon: Calendar },
                  { value: 'income' as const, label: 'Receitas', icon: ArrowDownLeft },
                  { value: 'expense' as const, label: 'Despesas', icon: ArrowUpRight },
                  { value: 'transfer' as const, label: 'Transferências', icon: Repeat },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
                      filterType === value
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    !selectedCategoryId
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  )}
                >
                  Todas
                </button>
                {categories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      selectedCategoryId === category.id
                        ? 'text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    )}
                    style={selectedCategoryId === category.id ? {
                      backgroundColor: category.color || '#6366f1'
                    } : undefined}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Período
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">De</label>
                  <Input
                    type="date"
                    value={dateRange.start || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value || null }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">Até</label>
                  <Input
                    type="date"
                    value={dateRange.end || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value || null }))}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 text-sm">
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
              <Button
                onClick={() => exportTransactions(filteredTransactions)}
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                disabled={filteredTransactions.length === 0}
              >
                📥 Exportar CSV
              </Button>
            </div>
          </Card>
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
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Receitas</p>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(totals.income)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <ArrowUpRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Despesas</p>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(totals.expense)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <Wallet className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        </div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Saldo</p>
                    </div>
                    <p className={cn(
                        'text-sm font-black',
                        totals.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    )}>
                        {formatCurrency(totals.net)}
                    </p>
                </div>
            </div>
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
