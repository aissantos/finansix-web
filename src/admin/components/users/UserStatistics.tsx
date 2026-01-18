import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Tag, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserDetail } from '@/admin/hooks/useUserDetail';

interface UserStatisticsProps {
  user: UserDetail;
}

export function UserStatistics({ user }: UserStatisticsProps) {
  const stats = user.statistics;

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma estatística disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Total Transactions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Total de Transações</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalTransactions}
            </div>
          </div>

          {/* Total Income */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Receitas</span>
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(stats.totalIncome)}
            </div>
          </div>

          {/* Total Expenses */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Despesas</span>
            </div>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </div>

          {/* Net Balance */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Saldo Líquido</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                stats.netBalance >= 0
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {formatCurrency(stats.netBalance)}
            </div>
          </div>

          {/* Categories Used */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <Tag className="h-4 w-4" />
              <span className="text-sm font-medium">Categorias Usadas</span>
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {stats.categoriesUsed}
            </div>
          </div>

          {/* Average Transaction */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Média por Transação</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(stats.averageTransactionAmount)}
            </div>
          </div>
        </div>

        {/* Date Range */}
        {stats.firstTransactionDate && stats.lastTransactionDate && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>
                Primeira transação:{' '}
                {format(new Date(stats.firstTransactionDate), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
              <Calendar className="h-4 w-4" />
              <span>
                Última transação:{' '}
                {format(new Date(stats.lastTransactionDate), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
