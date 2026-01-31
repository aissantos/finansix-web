import { useMemo } from 'react';
import { PieChart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { TransactionWithDetails } from '@/types';

interface CategoryDistributionChartProps {
  transactions: TransactionWithDetails[];
}

export function CategoryDistributionChart({ transactions }: CategoryDistributionChartProps) {
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, { name: string; amount: number; color: string; count: number }>();
    
    transactions
      .filter(t => t.type === 'expense') // Only expenses for distribution
      .forEach(t => {
        const catId = t.category_id || 'uncategorized';
        const catName = t.category?.name || 'Sem categoria';
        const catColor = t.category?.color || '#94a3b8';
        
        if (totals.has(catId)) {
          const existing = totals.get(catId)!;
          existing.amount += t.amount;
          existing.count += 1;
        } else {
          totals.set(catId, {
            name: catName,
            amount: t.amount,
            color: catColor,
            count: 1
          });
        }
      });

    return Array.from(totals.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
  }, [transactions]);

  const totalExpenses = categoryTotals.reduce((sum, cat) => sum + cat.amount, 0);

  if (categoryTotals.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Distribuição por Categoria
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Top 5 despesas
          </p>
        </div>
        <PieChart className="h-5 w-5 text-slate-400" />
      </div>

      <div className="space-y-3">
        {categoryTotals.map((cat, index) => {
          const percentage = (cat.amount / totalExpenses) * 100;
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div 
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({cat.count})
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-shrink-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: cat.color 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
