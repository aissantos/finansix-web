import React, { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMonthlyTrend } from '@/hooks/useMonthlyComparison';

// Lazy load the Recharts implementation
// This ensures 'recharts' is not in the main bundle
const MonthlyTrendChartImpl = React.lazy(() => import('./MonthlyTrendChartImpl'));

interface MonthlyTrendChartProps {
  months?: number;
  type?: 'area' | 'bar';
  showLegend?: boolean;
  height?: number;
}

export function MonthlyTrendChart(props: MonthlyTrendChartProps) {
  return (
    <Suspense fallback={<MonthlyTrendChartSkeleton />}>
        <MonthlyTrendChartImpl {...props} />
    </Suspense>
  );
}

function MonthlyTrendChartSkeleton() {
    return (
      <Card className="p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </Card>
    );
}

/**
 * MiniTrendChart stays here because it doesn't use heavy dependencies.
 * It uses simple divs for bars.
 */
export function MiniTrendChart({ months = 6 }: { months?: number }) {
  const { data: trends, isLoading } = useMonthlyTrend(months);

  if (isLoading || !trends) {
    return <Skeleton className="h-16 w-full" />;
  }

  // Find max value for scaling safe division
  const max = Math.max(...trends.map(t => Math.max(t.income, t.expenses)), 1);

  return (
    <div className="flex items-end gap-1 h-16">
      {trends.map((t, i) => (
        <div key={i} className="flex-1 flex flex-col gap-0.5">
          <div 
            className="bg-emerald-500/60 rounded-t"
            style={{ height: `${(t.income / max) * 100}%` }}
          />
          <div 
            className="bg-red-500/60 rounded-b"
            style={{ height: `${(t.expenses / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
