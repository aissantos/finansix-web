import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CategoryData {
  category_id: string;
  category_name: string;
  transaction_count: number;
  total_amount: number;
  percentage: number;
}

interface CategoryDistributionChartProps {
  data: CategoryData[];
  isLoading?: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function CategoryDistributionChart({ data, isLoading }: CategoryDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Categoria</CardTitle>
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
          <CardTitle>Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-slate-400">
            Sem dados para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for pie chart
  const chartData = data.map((item) => ({
    name: item.category_name || 'Sem categoria',
    value: item.transaction_count,
    amount: item.total_amount,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Categoria</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Transações por categoria
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number, name: string, props: any) => {
                if (name === 'value') {
                  return [
                    `${value} transações (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.name,
                  ];
                }
                return [value, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const item = chartData.find((d) => d.name === entry.payload.name);
                return `${value} (${item?.value || 0})`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Category List */}
        <div className="mt-6 space-y-2">
          {chartData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-500 dark:text-slate-400">
                  {item.value} transações
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
