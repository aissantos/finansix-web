import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Download, TrendingUp, Users, Home, DollarSign } from 'lucide-react';
import { useAnalyticsDashboard } from '@/admin/hooks/useAnalytics';
import { useExport } from '@/admin/hooks/useExport';
import { format, subDays } from 'date-fns';
import { TransactionTrendChart } from '@/admin/components/analytics/TransactionTrendChart';
import { CategoryDistributionChart } from '@/admin/components/analytics/CategoryDistributionChart';
import { HouseholdGrowthChart } from '@/admin/components/analytics/HouseholdGrowthChart';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { userActivity, transactions, householdGrowth, categoryDist: _categoryDist, isLoading, error } =
    useAnalyticsDashboard({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

  const { exportToCSV } = useExport();

  const handleExport = () => {
    if (transactions.data) {
      exportToCSV(
        [
          {
            period: `${dateRange.startDate} to ${dateRange.endDate}`,
            total_transactions: transactions.data.total_transactions,
            total_income: transactions.data.total_income,
            total_expense: transactions.data.total_expense,
            net_balance: transactions.data.net_balance,
          },
        ],
        { filename: `analytics-${dateRange.startDate}-${dateRange.endDate}.csv` }
      );
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">
              Erro ao carregar analytics: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Analytics & Relatórios
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Insights e métricas do sistema
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-slate-500" />
            <div className="flex gap-4 items-center">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="block mt-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Data Final
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="block mt-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
                />
              </div>
              <div className="pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDateRange({
                      startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                      endDate: format(new Date(), 'yyyy-MM-dd'),
                    })
                  }
                >
                  Últimos 7 dias
                </Button>
              </div>
              <div className="pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDateRange({
                      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                      endDate: format(new Date(), 'yyyy-MM-dd'),
                    })
                  }
                >
                  Últimos 30 dias
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* DAU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Usuários Ativos (Dia)
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {userActivity.data?.dau || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">DAU</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* WAU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Usuários Ativos (Semana)
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {userActivity.data?.wau || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">WAU</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* MAU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Usuários Ativos (Mês)
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {userActivity.data?.mau || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">MAU</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Households */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Households Ativos
            </CardTitle>
            <Home className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {householdGrowth.data?.active_households || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  +{householdGrowth.data?.new_households || 0} novos
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total de Transações
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {transactions.data?.total_transactions || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Receitas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(transactions.data?.total_income || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Despesas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(transactions.data?.total_expense || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionTrendChart
          data={transactions.data?.daily_trend || []}
          isLoading={isLoading}
        />

        <CategoryDistributionChart
          data={_categoryDist.data || []}
          isLoading={isLoading}
        />
      </div>

      {/* Household Growth Chart */}
      <HouseholdGrowthChart
        data={householdGrowth.data?.by_date || []}
        isLoading={isLoading}
      />
    </div>
  );
}
