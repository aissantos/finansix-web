import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HouseholdGrowthData {
  date: string;
  count: number;
}

interface HouseholdGrowthChartProps {
  data: HouseholdGrowthData[];
  isLoading?: boolean;
}

export function HouseholdGrowthChart({ data, isLoading }: HouseholdGrowthChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crescimento de Households</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crescimento de Households</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-slate-400">
            Sem dados para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
    novos: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento de Households</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Novos households criados por dia
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey="date"
              className="text-xs text-slate-600 dark:text-slate-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs text-slate-600 dark:text-slate-400"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number) => [value, 'Novos Households']}
            />
            <Legend />
            <Bar
              dataKey="novos"
              fill="#8b5cf6"
              radius={[8, 8, 0, 0]}
              name="Novos Households"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
