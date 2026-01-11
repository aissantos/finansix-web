import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Calendar,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTransactions, useCategories } from '@/hooks';
import { formatCurrency, cn } from '@/lib/utils';
import { startOfWeek, endOfWeek, startOfMonth, subMonths } from 'date-fns';
import { useState } from 'react';

interface Insight {
  id: string;
  type: 'warning' | 'tip' | 'achievement' | 'goal';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  color: string;
  priority: number;
}

export function SmartInsights() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  const insights = useMemo(() => {
    return generateInsights(transactions, categories);
  }, [transactions, categories]);

  const visibleInsights = insights
    .filter(insight => !dismissedInsights.includes(insight.id))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3); // Show top 3 insights

  const handleDismiss = (insightId: string) => {
    setDismissedInsights(prev => [...prev, insightId]);
  };

  if (visibleInsights.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Insights Inteligentes
          </h3>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {visibleInsights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.9 }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card
              className={cn(
                'p-4 relative overflow-hidden',
                insight.color
              )}
            >
              {/* Decorative gradient */}
              <div className="absolute inset-0 opacity-5">
                <div className={cn(
                  'absolute inset-0',
                  insight.type === 'warning' && 'gradient-error',
                  insight.type === 'tip' && 'gradient-info',
                  insight.type === 'achievement' && 'gradient-success',
                  insight.type === 'goal' && 'gradient-purple'
                )} />
              </div>

              <div className="relative flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
                  insight.type === 'warning' && 'bg-red-100 dark:bg-red-900/30 text-red-600',
                  insight.type === 'tip' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                  insight.type === 'achievement' && 'bg-green-100 dark:bg-green-900/30 text-green-600',
                  insight.type === 'goal' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                )}>
                  <insight.icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {insight.message}
                  </p>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => handleDismiss(insight.id)}
                  className="flex-shrink-0 h-6 w-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Dispensar insight"
                >
                  <X className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  );
}

/**
 * Generate contextual insights using pattern recognition
 */
function generateInsights(transactions: any[], categories: any[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // Week analysis
  const thisWeekStart = startOfWeek(now);
  const thisWeekEnd = endOfWeek(now);
  
  const thisWeekExpenses = transactions.filter(tx => {
    const date = new Date(tx.transaction_date);
    return tx.type === 'expense' && date >= thisWeekStart && date <= thisWeekEnd;
  });

  const lastWeekExpenses = transactions.filter(tx => {
    const date = new Date(tx.transaction_date);
    return tx.type === 'expense' && date >= subMonths(thisWeekStart, 0) && date < thisWeekStart;
  });

  // Category spending analysis
  const categorySpending = new Map<string, number>();
  thisWeekExpenses.forEach(tx => {
    const current = categorySpending.get(tx.category_id) || 0;
    categorySpending.set(tx.category_id, current + tx.amount);
  });

  // Previous period for comparison
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthExpenses = transactions.filter(tx => {
    const date = new Date(tx.transaction_date);
    return tx.type === 'expense' && date >= lastMonthStart;
  });

  const lastMonthCategorySpending = new Map<string, number>();
  lastMonthExpenses.forEach(tx => {
    const current = lastMonthCategorySpending.get(tx.category_id) || 0;
    lastMonthCategorySpending.set(tx.category_id, current + tx.amount);
  });

  // Insight 1: Spending spike detection
  const thisWeekTotal = thisWeekExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  const lastWeekTotal = lastWeekExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  
  if (thisWeekTotal > lastWeekTotal * 1.2 && thisWeekTotal > 500) {
    const increase = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
    insights.push({
      id: 'spending-spike',
      type: 'warning',
      icon: TrendingUp,
      title: 'Gastos Acima do Normal',
      message: `Você gastou ${increase.toFixed(0)}% a mais esta semana (${formatCurrency(thisWeekTotal)}) comparado à semana passada.`,
      color: 'border-l-4 border-red-500',
      priority: 90,
    });
  }

  // Insight 2: Category overspending
  for (const [categoryId, spending] of categorySpending) {
    const lastMonthSpending = lastMonthCategorySpending.get(categoryId) || 0;
    const category = categories.find(c => c.id === categoryId);
    
    if (spending > lastMonthSpending * 1.5 && spending > 200 && category) {
      const increase = ((spending - lastMonthSpending) / (lastMonthSpending || 1)) * 100;
      insights.push({
        id: `category-spike-${categoryId}`,
        type: 'warning',
        icon: AlertTriangle,
        title: `Alerta: ${category.name}`,
        message: `Gastos em ${category.name} aumentaram ${increase.toFixed(0)}% este mês. Considere revisar esses gastos.`,
        color: 'border-l-4 border-orange-500',
        priority: 80,
      });
    }
  }

  // Insight 3: Positive savings pattern
  const thisMonthIncome = transactions
    .filter(tx => tx.type === 'income' && new Date(tx.transaction_date) >= startOfMonth(now))
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const thisMonthExpenses = transactions
    .filter(tx => tx.type === 'expense' && new Date(tx.transaction_date) >= startOfMonth(now))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const savingsRate = thisMonthIncome > 0
    ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100
    : 0;

  if (savingsRate > 20) {
    insights.push({
      id: 'good-savings',
      type: 'achievement',
      icon: Target,
      title: 'Ótima Taxa de Economia!',
      message: `Você está economizando ${savingsRate.toFixed(0)}% da sua renda este mês. Continue assim!`,
      color: 'border-l-4 border-green-500',
      priority: 70,
    });
  }

  // Insight 4: Spending pattern tip
  const weekdayExpenses = thisWeekExpenses.filter(tx => {
    const day = new Date(tx.transaction_date).getDay();
    return day >= 1 && day <= 5; // Mon-Fri
  });

  const weekendExpenses = thisWeekExpenses.filter(tx => {
    const day = new Date(tx.transaction_date).getDay();
    return day === 0 || day === 6; // Sat-Sun
  });

  const weekdayAvg = weekdayExpenses.length > 0
    ? weekdayExpenses.reduce((sum, tx) => sum + tx.amount, 0) / weekdayExpenses.length
    : 0;

  const weekendAvg = weekendExpenses.length > 0
    ? weekendExpenses.reduce((sum, tx) => sum + tx.amount, 0) / weekendExpenses.length
    : 0;

  if (weekendAvg > weekdayAvg * 1.5 && weekendExpenses.length > 0) {
    insights.push({
      id: 'weekend-spending',
      type: 'tip',
      icon: Calendar,
      title: 'Padrão de Gastos no Fim de Semana',
      message: `Você gasta em média ${formatCurrency(weekendAvg)} por dia nos fins de semana, ${((weekendAvg / weekdayAvg - 1) * 100).toFixed(0)}% mais que em dias úteis.`,
      color: 'border-l-4 border-blue-500',
      priority: 60,
    });
  }

  // Insight 5: Low transaction count (encourage tracking)
  if (transactions.length < 10 && transactions.length > 0) {
    insights.push({
      id: 'track-more',
      type: 'tip',
      icon: Lightbulb,
      title: 'Registre Mais Transações',
      message: 'Quanto mais transações você registrar, melhores insights e previsões poderemos oferecer!',
      color: 'border-l-4 border-purple-500',
      priority: 50,
    });
  }

  return insights;
}
