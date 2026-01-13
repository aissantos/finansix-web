import { CheckCircle, MoreHorizontal } from 'lucide-react';
import { useInstallmentProjection } from '@/hooks';
import { formatCurrency, formatMonthShort, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function ReliefChart() {
  const { data: projection, isLoading } = useInstallmentProjection(12);

  if (isLoading) {
    return <ReliefChartSkeleton />;
  }

  if (!projection?.length) {
    return null;
  }

  // Filter out months with zero installments for better visualization
  const nonZeroProjection = projection.filter(p => p.totalInstallments > 0);
  
  // If no installments at all, don't show the component
  if (nonZeroProjection.length === 0) {
    return null;
  }

  // Find max value for scaling
  const maxValue = Math.max(...projection.map((p) => p.totalInstallments), 1);

  // Find the last month that actually has installments
  let lastMonthIndex = projection.length - 1;
  while (lastMonthIndex >= 0 && projection[lastMonthIndex].totalInstallments === 0) {
    lastMonthIndex--;
  }
  
  // If no month with installments found, don't show
  if (lastMonthIndex < 0) {
    return null;
  }
  
  // Calculate relief
  const lastMonthWithInstallments = projection[lastMonthIndex].totalInstallments;
  
  // The relief month is the NEXT month after the last installment
  // If last installment is in index 4 (mai), relief is in index 5 (jun)
  const reliefMonthIndex = lastMonthIndex + 1;
  const hasReliefMonth = reliefMonthIndex < projection.length;
  
  // Relief amount is the amount from the last month with installments
  const reliefAmount = lastMonthWithInstallments;
  
  // Show relief message if there's a relief month within our projection
  const shouldShowRelief = hasReliefMonth && reliefAmount > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Projeção de Alívio
          </h3>
          <p className="text-xs text-slate-500">Queda nas parcelas (12 meses)</p>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <Card className="glass-card p-5">
        {/* Bar chart */}
        <div className="flex justify-between h-36 gap-2 w-full pt-4">
          {projection.slice(0, 12).map((month, i) => {
            const height = (month.totalInstallments / maxValue) * 100;
            const isLastMonth = i === projection.length - 1;
            const hasInstallments = month.totalInstallments > 0;

            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full group">
                <div className="relative w-full bg-slate-100 dark:bg-slate-700 rounded-t-lg flex-1 overflow-hidden">
                  {hasInstallments && (
                    <div
                      className={cn(
                        'absolute bottom-0 w-full rounded-t-lg transition-all duration-500',
                        isLastMonth
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                          : 'bg-gradient-to-t from-blue-700 to-blue-500 opacity-80'
                      )}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {formatMonthShort(month.month).charAt(0)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Relief message - shows the first month WITHOUT installments */}
        {shouldShowRelief && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              Em {formatMonthShort(projection[reliefMonthIndex]?.month ?? new Date())}, você terá{' '}
              <strong className="text-slate-900 dark:text-white">
                {formatCurrency(reliefAmount)}
              </strong>{' '}
              livres a mais.
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}

function ReliefChartSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Card className="p-5">
        <div className="flex items-end justify-between h-32 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="w-full h-full" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
