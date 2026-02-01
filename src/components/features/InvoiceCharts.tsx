import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { InstallmentWithDetails, Transaction } from '@/types';
import { format, parseISO } from 'date-fns';

interface InvoiceChartsProps {
  transactions: (Transaction | InstallmentWithDetails)[];
  viewMode?: 'daily' | 'monthly';
}

const COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316'  // Orange
];

export function InvoiceCharts({ transactions, viewMode = 'daily' }: InvoiceChartsProps) {
  
  // 1. Calculate Category Distribution
  const categoryData = useMemo(() => {
    const categoriesMap = new Map<string, number>();
    
    transactions.filter(t => {
      // Filter out Invoice Payment transactions to avoid double counting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const desc = ((t as any).transaction?.description || (t as any).description) || '';
      return !desc.toLowerCase().startsWith('fatura') && !desc.toLowerCase().includes('pagamento de fatura');
    }).forEach(item => {
      // Check if item is Installment (has transaction property) or Transaction
      let categoryName: string | undefined;
      
      if ('transaction' in item && item.transaction) {
          categoryName = item.transaction.category?.name;
      } else if ('category' in item) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categoryName = (item as any).category?.name;
      }
        
      const name = categoryName || 'Outros';
      const amount = item.amount;
      
      categoriesMap.set(name, (categoriesMap.get(name) || 0) + amount);
    });
    
    return Array.from(categoriesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort descending
  }, [transactions]);

  // 2. Calculate Spending Trend (Daily or Monthly)
  const trendData = useMemo(() => {
    const trendMap = new Map<string, number>();
    
    transactions.filter(t => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const desc = ((t as any).transaction?.description || (t as any).description) || '';
      return !desc.toLowerCase().startsWith('fatura') && !desc.toLowerCase().includes('pagamento de fatura');
    }).forEach(item => {
       
       let dateStr: string | undefined;

       if ('transaction' in item && item.transaction) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dateStr = (item.transaction as any).transaction_date;
       } else if ('transaction_date' in item) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dateStr = (item as any).transaction_date;
       } else {
            dateStr = item.due_date;
       }
       
       if (!dateStr) return;
       
       // Grouping
       let key = ''; 
       if (viewMode === 'monthly') {
          // Format as "MMM/yy" (e.g. Fev/26)
          key = format(parseISO(dateStr), 'MMM/yy');
       } else {
          // Daily: "dd"
          key = format(parseISO(dateStr), 'dd');
       }
       
       trendMap.set(key, (trendMap.get(key) || 0) + item.amount);
    });

    return Array.from(trendMap.entries())
      .map(([label, total]) => ({ label, total }));
      // .sort logic removed as map iteration usually preserves insertion order for string keys in modern JS
      // or we accept chronological order from input if transactions are ordered.
      // If sort needed later, use proper date parsing.
  }, [transactions, viewMode]);

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Category Chart */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Por Categoria {viewMode === 'monthly' ? '(Global)' : ''}
        </h3>
        <div className="h-[200px] flex items-center">
          <ResponsiveContainer width="50%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="w-1/2 pl-2 space-y-1 overflow-y-auto max-h-[180px] custom-scrollbar">
            {categoryData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                  />
                  <span className="truncate text-slate-600 dark:text-slate-300">{entry.name}</span>
                </div>
                <span className="font-medium">{Math.round((entry.value / transactions.reduce((a, b) => a + b.amount, 0)) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Consumption Trend Chart */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          {viewMode === 'monthly' ? 'Histórico Mensal' : 'Gasto Diário'}
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-xl">
                        <p className="font-bold mb-1">{payload[0].payload.label}</p>
                        <p>{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="total" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                barSize={20} // Thinner bars for aesthetic
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
