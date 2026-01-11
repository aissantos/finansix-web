import { memo, useRef } from 'react';
import { Clock, CheckCircle2, AlertTriangle, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { usePaymentSummary } from '@/hooks';

interface PaymentSummaryCardsProps {
  className?: string;
}

export const PaymentSummaryCards = memo(function PaymentSummaryCards({
  className,
}: PaymentSummaryCardsProps) {
  const { data: summary, isLoading } = usePaymentSummary();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 160;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <div className={cn('relative', className)}>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-1 py-1">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-36 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    {
      label: 'A Pagar',
      value: summary?.pending ?? 0,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-800/40',
      borderColor: 'border-amber-200/50 dark:border-amber-700/30',
    },
    {
      label: 'Pago',
      value: summary?.paid ?? 0,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/20',
      iconBg: 'bg-green-100 dark:bg-green-800/40',
      borderColor: 'border-green-200/50 dark:border-green-700/30',
    },
    {
      label: 'Vencido',
      value: summary?.overdue ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/20',
      iconBg: 'bg-red-100 dark:bg-red-800/40',
      borderColor: 'border-red-200/50 dark:border-red-700/30',
      highlight: (summary?.overdue ?? 0) > 0,
    },
    {
      label: 'Saldo Parcial',
      value: summary?.partial_balance ?? 0,
      icon: ArrowDownCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-800/40',
      borderColor: 'border-blue-200/50 dark:border-blue-700/30',
      isNegative: true,
    },
  ];

  return (
    <section className={cn('relative', className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Resumo de Pagamentos
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar scroll-smooth px-1 py-1 -mx-1"
      >
        {items.map((item, index) => {
          const Icon = item.icon;
          const showValue = item.value > 0 || item.label === 'A Pagar';
          const displayValue = item.isNegative && item.value > 0 ? -item.value : item.value;

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0"
            >
              <Card
                className={cn(
                  'w-36 p-4 border backdrop-blur-sm',
                  'transition-all duration-200 hover:scale-[1.02] hover:shadow-md',
                  item.bgColor,
                  item.borderColor,
                  item.highlight && 'ring-2 ring-red-500/50 ring-offset-1'
                )}
              >
                <div className="flex flex-col h-full">
                  {/* Icon */}
                  <div
                    className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center mb-3',
                      item.iconBg
                    )}
                  >
                    <Icon className={cn('h-4 w-4', item.color)} />
                  </div>

                  {/* Label */}
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    {item.label}
                  </p>

                  {/* Value */}
                  <p className={cn('text-lg font-bold leading-tight', item.color)}>
                    {showValue ? formatCurrency(displayValue) : 'R$ 0,00'}
                  </p>

                  {/* Warning indicator */}
                  {item.highlight && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-red-600 dark:text-red-400">
                        Atenção
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Scroll Indicator Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {items.map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              index === 0 ? 'w-4 bg-primary' : 'w-1.5 bg-slate-200 dark:bg-slate-700'
            )}
          />
        ))}
      </div>
    </section>
  );
});

export default PaymentSummaryCards;
