import { useState } from 'react';
import { useGlobalTransactions, useAggregateStats } from '../../hooks/useGlobalTransactions';
import type { TransactionWithDetails } from '../../hooks/useGlobalTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, FilterX, ArrowUpCircle, ArrowDownCircle, DollarSign, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { TransactionDetailModal } from './TransactionDetailModal';

export function TransactionsListPage() {
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    minValue: '',
    maxValue: '',
  });

  const hookFilters = {
    ...filters,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    minValue: filters.minValue ? Number(filters.minValue) : undefined,
    maxValue: filters.maxValue ? Number(filters.maxValue) : undefined,
    // clear empty
    type: filters.type === 'all' ? undefined : filters.type,
    status: filters.status === 'all' ? undefined : filters.status,
    search: filters.search || undefined,
  };

  const { data: stats } = useAggregateStats(hookFilters.dateFrom, hookFilters.dateTo);
  const { data, isLoading, isError } = useGlobalTransactions({
    page,
    pageSize: 20,
    filters: hookFilters,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: '',
      minValue: '',
      maxValue: '',
    });
    setPage(1);
  };

  const handleRowClick = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Transações Globais</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats ? formatCurrency(stats.total_income) : 'R$ ...'}
            </div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats ? formatCurrency(stats.total_expenses) : 'R$ ...'}
            </div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats && stats.net_balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {stats ? formatCurrency(stats.net_balance) : 'R$ ...'}
            </div>
            <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transações</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
              {stats?.total_transactions || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar (Descrição ou Email)"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
             <Select
              value={filters.type}
              onValueChange={(val) => handleFilterChange('type', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="block"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="block"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={clearFilters} className="flex gap-2">
              <FilterX className="h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lists */}
      <div className="rounded-md border bg-white dark:bg-slate-950">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">Erro ao carregar transações.</div>
        ) : data?.data.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Nenhuma transação encontrada.</div>
        ) : (
          <div className="relative w-full overflow-auto">
             <table className="w-full caption-bottom text-sm text-left">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Usuário</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Descrição</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Valor</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Tipo</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {data?.data.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                    onClick={() => handleRowClick(tx)}
                  >
                    <td className="p-4 align-middle font-mono text-xs">
                      {format(new Date(tx.transaction_date), 'dd/MM/yyyy')}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{tx.users?.display_name || tx.users?.email || 'N/A'}</span>
                        <span className="text-xs text-muted-foreground">{tx.users?.email}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                         <span>{tx.description}</span>
                         <span className="text-xs text-muted-foreground">{tx.categories?.name} • {tx.households?.name}</span>
                      </div>
                    </td>
                    <td className={`p-4 align-middle font-mono font-bold ${
                      tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-600' : 'text-slate-600'
                    }`}>
                      {tx.type === 'expense' ? '- ' : '+ '}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="secondary" className="capitalize">
                        {tx.type}
                      </Badge>
                    </td>
                     <td className="p-4 align-middle">
                      <Badge variant={tx.status === 'completed' ? 'default' : 'outline'} className="capitalize">
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

       {/* Pagination */}
       {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <div className="text-sm font-medium">
            Página {page} de {data.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      <TransactionDetailModal 
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
