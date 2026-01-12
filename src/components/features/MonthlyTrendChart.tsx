import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMonthlyTrend } from '@/hooks/useMonthlyComparison';
import { formatCurrency, cn } from '@/lib/utils';

interface MonthlyTrendChartProps {
  months?: number;
  type?: 'area' | 'bar';
  showLegend?: boolean;
  height?: number;
}

export function MonthlyTrendChart({
  months = 6,
  type = 'area',
  showLegend = true,
  height = 250,
}: MonthlyTrendChartProps) {
  const { data: trends, isLoading } = useMonthlyTrend(months);

  const chartData = useMemo(() => {
    if (!trends) return [];
    return trends.map(t => ({
      ...t,
      label: t.label.charAt(0).toUpperCase() + t.label.slice(1),
    }));
  }, [trends]);

  // Calcular tendência geral
  const trend = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    
    const firstMonth = chartData[0];
    const lastMonth = chartData[chartData.length - 1];
    
    const expenseChange = lastMonth.expenses - firstMonth.expenses;
    const incomeChange = lastMonth.income - firstMonth.income;
    
    return {
      expenses: {
        value: expenseChange,
        percent: firstMonth.expenses > 0 
          ? ((expenseChange / firstMonth.expenses) * 100).toFixed(0)
          : '0',
        isUp: expenseChange > 0,
      },
      income: {
        value: incomeChange,
        percent: firstMonth.income > 0 
          ? ((incomeChange / firstMonth.income) * 100).toFixed(0)
          : '0',
        isUp: incomeChange > 0,
      },
    };
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-[250px] w-full" />
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-slate-500 text-sm">
          Sem dados suficientes para mostrar tendência
        </p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (!active || !payload) return null;
    
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-bold text-sm text-slate-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="h-2 w-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Tendência dos Últimos {months} Meses
          </h2>
          <p className="text-xs text-slate-500">Evolução de receitas e despesas</p>
        </div>
        
        {/* Trend Indicators */}
        {trend && (
          <div className="flex gap-3">
            <TrendIndicator
              label="Despesas"
              value={trend.expenses.percent}
              isUp={trend.expenses.isUp}
              isGood={!trend.expenses.isUp}
            />
            <TrendIndicator
              label="Receitas"
              value={trend.income.percent}
              isUp={trend.income.isUp}
              isGood={trend.income.isUp}
            />
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-slate-600">{value}</span>
                )}
              />
            )}
            <Area
              type="monotone"
              dataKey="income"
              name="Receitas"
              stroke="#22c55e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncome)"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Despesas"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpenses)"
            />
          </AreaChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-slate-600">{value}</span>
                )}
              />
            )}
            <Bar dataKey="income" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}

function TrendIndicator({
  value,
  isUp,
  isGood,
}: {
  label?: string;
  value: string;
  isUp: boolean;
  isGood: boolean;
}) {
  const numValue = parseFloat(value);
  
  return (
    <div className={cn(
      'px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold',
      isGood
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : numValue === 0
          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    )}>
      {numValue === 0 ? (
        <Minus className="h-3 w-3" />
      ) : isUp ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>{Math.abs(numValue)}%</span>
    </div>
  );
}

/**
 * Versão compacta para uso em cards menores
 */
export function MiniTrendChart({ months = 6 }: { months?: number }) {
  const { data: trends, isLoading } = useMonthlyTrend(months);

  if (isLoading || !trends) {
    return <Skeleton className="h-16 w-full" />;
  }

  const max = Math.max(...trends.map(t => Math.max(t.income, t.expenses)));

  return (
    <div className="flex items-end gap-1 h-16">
      {trends.map((t, i) => (
        <div key={i} className="flex-1 flex flex-col gap-0.5">
          <div 
            className="bg-income/60 rounded-t"
            style={{ height: `${(t.income / max) * 100}%` }}
          />
          <div 
            className="bg-expense/60 rounded-b"
            style={{ height: `${(t.expenses / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
