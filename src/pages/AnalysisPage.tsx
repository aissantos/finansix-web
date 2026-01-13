import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, TrendingUp, TrendingDown, PieChart, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MonthlyTrendChart } from '@/components/features/MonthlyTrendChart';
import { TransactionList } from '@/components/features/TransactionList';
import { useTransactionsByCategory, useFreeBalance, usePaymentSummary } from '@/hooks';
import { useMonthlyComparison } from '@/hooks/useMonthlyComparison';
import { useSelectedMonth } from '@/stores';
import { formatCurrency, cn } from '@/lib/utils';

export default function AnalysisPage() {
  const selectedMonth = useSelectedMonth();

  return (
    <>
      <Header title="Dashboard Analítico" showMonthSelector />
      <PageContainer className="space-y-6 pt-4">
        {/* Month Selector Button */}
        <div className="flex items-center justify-center">
          <button className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-primary border border-slate-100 dark:border-slate-700 active:scale-95 transition-transform">
            <Calendar className="h-5 w-5" />
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </button>
        </div>

        {/* Summary Cards - Horizontal Scroll */}
        <SummaryCards />

        {/* Monthly Comparison */}
        <MonthlyComparison />

        {/* Recent Transactions with Swipe Gestures */}
        <TransactionList 
          limit={10}
          showTitle={true}
          onViewAll={() => navigate('/transactions')}
          enableSwipeGestures={true}
        />

        {/* Monthly Trend Chart */}
        <MonthlyTrendChart months={6} />

        {/* Category Distribution */}
        <CategoryDistribution />
      </PageContainer>
    </>
  );
}

function SummaryCards() {
  const { data: balance, isLoading: balanceLoading } = useFreeBalance();
  const { data: paymentSummary, isLoading: paymentLoading } = usePaymentSummary();

  const isLoading = balanceLoading || paymentLoading;

  if (isLoading) {
    return (
      <section className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="min-w-[160px] h-32 rounded-2xl flex-shrink-0" />
        ))}
      </section>
    );
  }

  const hasOverdue = (paymentSummary?.overdue ?? 0) > 0;

  return (
    <section className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
      {/* Balance Card */}
      <div className="min-w-[170px] h-32 rounded-2xl bg-primary text-white p-4 flex flex-col justify-between shadow-lg shadow-primary/30 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-4 -mt-4" />
        <div>
          <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-bold uppercase">
            <TrendingUp className="h-3.5 w-3.5" />
            Saldo Livre
          </div>
          <p className="text-xl font-extrabold mt-1">
            {formatCurrency(balance?.freeBalance ?? 0)}
          </p>
        </div>
        <div className="bg-white/20 w-fit px-2 py-0.5 rounded-lg text-[9px] font-bold">
          Disponível
        </div>
      </div>

      {/* Income Card */}
      <div className="min-w-[150px] h-32 rounded-2xl bg-white dark:bg-slate-800 p-4 flex flex-col justify-between border border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <TrendingUp className="h-3.5 w-3.5 text-income" />
            <span className="text-[10px] font-bold uppercase">Receitas</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(balance?.expectedIncome ?? 0)}
          </p>
        </div>
        <span className="text-income text-[9px] font-bold">Esperadas</span>
      </div>

      {/* Expenses Card */}
      <div className="min-w-[150px] h-32 rounded-2xl bg-white dark:bg-slate-800 p-4 flex flex-col justify-between border border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <TrendingDown className="h-3.5 w-3.5 text-expense" />
            <span className="text-[10px] font-bold uppercase">Despesas</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(balance?.creditCardDue ?? 0)}
          </p>
        </div>
        <span className="text-expense text-[9px] font-bold">Em faturas</span>
      </div>

      {/* Pending Bills Card */}
      <div className="min-w-[150px] h-32 rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 flex flex-col justify-between border border-amber-200 dark:border-amber-800 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-amber-600">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase">A Pagar</span>
          </div>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-1">
            {formatCurrency(paymentSummary?.pending ?? 0)}
          </p>
        </div>
        <span className="text-amber-600 text-[9px] font-bold">Pendente</span>
      </div>

      {/* Overdue Card - Only shows if has overdue */}
      {hasOverdue && (
        <div className="min-w-[150px] h-32 rounded-2xl bg-red-50 dark:bg-red-900/20 p-4 flex flex-col justify-between border-2 border-red-300 dark:border-red-700 flex-shrink-0 ring-2 ring-red-400 ring-offset-2">
          <div>
            <div className="flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[10px] font-bold uppercase">Vencido</span>
            </div>
            <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
              {formatCurrency(paymentSummary?.overdue ?? 0)}
            </p>
          </div>
          <span className="text-red-500 text-[9px] font-bold">⚠️ Atenção!</span>
        </div>
      )}

      {/* Paid Card */}
      <div className="min-w-[150px] h-32 rounded-2xl bg-green-50 dark:bg-green-900/20 p-4 flex flex-col justify-between border border-green-200 dark:border-green-800 flex-shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase">Pago</span>
          </div>
          <p className="text-lg font-bold text-green-700 dark:text-green-300 mt-1">
            {formatCurrency(paymentSummary?.paid ?? 0)}
          </p>
        </div>
        <span className="text-green-600 text-[9px] font-bold">Este mês</span>
      </div>
    </section>
  );
}

function MonthlyComparison() {
  const { data: comparison, isLoading } = useMonthlyComparison();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  if (!comparison) {
    return null;
  }

  const { currentMonth, previousMonth, difference, isSpendingMore } = comparison;
  const currentTotal = currentMonth.expenses;
  const prevTotal = previousMonth.expenses;
  const diffPercent = Math.abs(difference.expensesPercent).toFixed(1);
  
  // Calcular porcentagem para a barra (máximo 150% para não quebrar o layout)
  const barPercent = prevTotal > 0 
    ? Math.min((currentTotal / prevTotal) * 100, 150) 
    : currentTotal > 0 ? 100 : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Comparativo Mensal
          </h2>
          <p className="text-xs text-slate-500">Despesas: Este mês vs. Anterior</p>
        </div>
        {(currentTotal > 0 || prevTotal > 0) && (
          <Badge variant={isSpendingMore ? 'danger' : 'success'}>
            {isSpendingMore ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {diffPercent}%
          </Badge>
        )}
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Este Mês
            </span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(currentTotal)}
            </p>
          </div>
          <div className="text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Mês Anterior
            </span>
            <p className="text-lg font-bold text-slate-500">
              {formatCurrency(prevTotal)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-slate-300 dark:bg-slate-600 rounded-full transition-all duration-1000"
            style={{ width: '100%', opacity: 0.5 }}
          />
          <div
            className={cn(
              'absolute h-full rounded-full transition-all duration-1000 delay-300',
              isSpendingMore ? 'bg-expense' : 'bg-income'
            )}
            style={{ width: `${barPercent}%` }}
          />
        </div>

        {/* Message */}
        {(currentTotal > 0 || prevTotal > 0) ? (
          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl flex items-center gap-3">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                isSpendingMore ? 'bg-red-100 text-expense' : 'bg-green-100 text-income'
              )}
            >
              {isSpendingMore ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
              {isSpendingMore
                ? `Você gastou ${formatCurrency(difference.expenses)} a mais que no mês passado.`
                : difference.expenses < 0
                  ? `Excelente! Você economizou ${formatCurrency(Math.abs(difference.expenses))} em comparação ao mês anterior.`
                  : 'Seus gastos estão iguais ao mês anterior.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl text-center">
            <p className="text-xs text-slate-500">
              Sem dados suficientes para comparação
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function CategoryDistribution() {
  const { data: categories, isLoading } = useTransactionsByCategory();

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-40 w-40 rounded-full mx-auto" />
      </Card>
    );
  }

  if (!categories?.length) {
    return null;
  }

  const total = categories.reduce((sum, c) => sum + c.total, 0);

  // Calculate pie chart segments
  let cumulativePercent = 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Distribuição de Gastos
          </h2>
          <p className="text-xs text-slate-500">Categorias mais relevantes</p>
        </div>
        <PieChart className="h-5 w-5 text-slate-400" />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Pie Chart */}
        <div className="relative h-40 w-40 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            {categories.slice(0, 5).map((cat, i) => {
              const percent = (cat.total / total) * 100;
              const strokeDasharray = `${percent} ${100 - percent}`;
              const strokeDashoffset = -cumulativePercent;
              cumulativePercent += percent;

              return (
                <circle
                  key={i}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth="3.8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-3">
          {categories.slice(0, 5).map((cat, i) => {
            const percent = ((cat.total / total) * 100).toFixed(0);
            return (
              <div key={i} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: cat.color }}
                  >
                    <span className="text-xs font-bold">{percent}%</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {cat.category_name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">
                      {percent}% do total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(cat.total)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
