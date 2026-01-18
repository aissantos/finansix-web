import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TransactionTrendData {
  date: string;
  count: number;
  total: number;
}

interface TransactionTrendChartProps {
  data: TransactionTrendData[];
  isLoading?: boolean;
}

export function TransactionTrendChart({ data, isLoading }: TransactionTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Transações</CardTitle>
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
          <CardTitle>Tendência de Transações</CardTitle>
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
    quantidade: item.count,
    valor: item.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Transações</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Volume e valor de transações ao longo do tempo
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey="date"
              className="text-xs text-slate-600 dark:text-slate-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              yAxisId="left"
              className="text-xs text-slate-600 dark:text-slate-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs text-slate-600 dark:text-slate-400"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'valor') {
                  return [
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(value),
                    'Valor Total',
                  ];
                }
                return [value, 'Quantidade'];
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="quantidade"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Quantidade"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="valor"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="Valor (R$)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
