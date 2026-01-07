import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, TrendingUp, TrendingDown, PieChart, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTransactionsByCategory, useFreeBalance, useTransactions } from '@/hooks';
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

        {/* Summary Cards */}
        <SummaryCards />

        {/* Monthly Comparison */}
        <MonthlyComparison />

        {/* Category Distribution */}
        <CategoryDistribution />

        {/* Pending Bills */}
        <PendingBills />
      </PageContainer>
    </>
  );
}

function SummaryCards() {
  const { data: balance, isLoading } = useFreeBalance();

  if (isLoading) {
    return (
      <section className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
        <Skeleton className="min-w-[180px] h-36 rounded-2xl" />
        <Skeleton className="min-w-[160px] h-36 rounded-2xl" />
      </section>
    );
  }

  return (
    <section className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
      {/* Balance Card */}
      <div className="min-w-[180px] h-36 rounded-2xl bg-primary text-white p-5 flex flex-col justify-between shadow-lg shadow-primary/30 relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-5 -mt-5" />
        <div>
          <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-bold uppercase">
            <TrendingUp className="h-4 w-4" />
            Saldo Livre
          </div>
          <p className="text-2xl font-extrabold mt-1">
            {formatCurrency(balance?.freeBalance ?? 0)}
          </p>
        </div>
        <div className="bg-white/20 w-fit px-2 py-1 rounded-lg text-[10px] font-bold">
          Atualizado
        </div>
      </div>

      {/* Income Card */}
      <div className="min-w-[160px] h-36 rounded-2xl bg-white dark:bg-slate-800 p-5 flex flex-col justify-between border border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp className="h-4 w-4 text-income" />
            <span className="text-[10px] font-bold uppercase">Receitas</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(balance?.expectedIncome ?? 0)}
          </p>
        </div>
        <span className="text-income text-[10px] font-bold">Esperadas</span>
      </div>

      {/* Expenses Card */}
      <div className="min-w-[160px] h-36 rounded-2xl bg-white dark:bg-slate-800 p-5 flex flex-col justify-between border border-slate-100 dark:border-slate-700 shadow-sm flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingDown className="h-4 w-4 text-expense" />
            <span className="text-[10px] font-bold uppercase">Despesas</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(balance?.creditCardDue ?? 0)}
          </p>
        </div>
        <span className="text-expense text-[10px] font-bold">Em faturas</span>
      </div>
    </section>
  );
}

function MonthlyComparison() {
  // This would ideally fetch current vs previous month data
  const currentTotal = 3560;
  const prevTotal = 3200;
  const diff = currentTotal - prevTotal;
  const diffPercent = ((diff / prevTotal) * 100).toFixed(1);
  const isSpendingMore = diff > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Comparativo Mensal
          </h2>
          <p className="text-xs text-slate-500">Este mês vs. Mês anterior</p>
        </div>
        <Badge variant={isSpendingMore ? 'danger' : 'success'}>
          {isSpendingMore ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {Math.abs(Number(diffPercent))}%
        </Badge>
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
            style={{ width: `${(currentTotal / prevTotal) * 100}%` }}
          />
        </div>

        {/* Message */}
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
              ? `Você gastou ${formatCurrency(diff)} a mais que no mês passado.`
              : `Excelente! Você economizou ${formatCurrency(Math.abs(diff))} em comparação ao mês anterior.`}
          </p>
        </div>
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

function PendingBills() {
  const { data: transactions } = useTransactions({ type: 'expense' });

  const pendingBills = transactions?.filter((t) => t.status === 'pending').slice(0, 3) || [];

  if (!pendingBills.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contas a Pagar</h2>
        <button className="text-primary text-xs font-bold hover:underline">Ver todas</button>
      </div>

      <div className="space-y-3">
        {pendingBills.map((bill) => (
          <div
            key={bill.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border-l-4 border-amber-500 flex items-center justify-between transition-all hover:translate-x-1"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
                  {bill.description}
                </h4>
                <p className="text-[10px] font-medium text-slate-400">
                  {bill.category?.name || 'Sem categoria'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {formatCurrency(bill.amount)}
              </p>
              <button className="text-primary text-[10px] font-bold mt-1 hover:underline">
                Pagar
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
