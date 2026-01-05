import { memo } from 'react';
import * as Icons from 'lucide-react';
import { formatCurrency, formatDateRelative, cn } from '@/lib/utils';
import type { TransactionWithDetails } from '@/types';
import { Badge } from '@/components/ui/badge';

interface TransactionItemProps {
  transaction: TransactionWithDetails;
  onClick?: () => void;
}

// Map category icons to Lucide icons
const iconMap: Record<string, keyof typeof Icons> = {
  utensils: 'Utensils',
  car: 'Car',
  home: 'Home',
  'heart-pulse': 'HeartPulse',
  'graduation-cap': 'GraduationCap',
  'gamepad-2': 'Gamepad2',
  'shopping-bag': 'ShoppingBag',
  repeat: 'Repeat',
  briefcase: 'Briefcase',
  laptop: 'Laptop',
  'trending-up': 'TrendingUp',
  'rotate-ccw': 'RotateCcw',
  'credit-card': 'CreditCard',
  receipt: 'Receipt',
};

function getIcon(iconName?: string) {
  if (!iconName) return Icons.Receipt;
  const lucideIconName = iconMap[iconName] || 'Receipt';
  return (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[lucideIconName] || Icons.Receipt;
}

export const TransactionItem = memo(function TransactionItem({
  transaction,
  onClick,
}: TransactionItemProps) {
  const Icon = getIcon(transaction.category?.icon || 'default');
  const isIncome = transaction.type === 'income';
  const hasInstallments = transaction.is_installment && (transaction.total_installments ?? 0) > 1;

  const categoryColor = transaction.category?.color || (isIncome ? '#22c55e' : '#ef4444');

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-transform',
        onClick && 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {transaction.description}
            </span>
            {hasInstallments && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {transaction.installments?.[0]?.installment_number || 1}/
                {transaction.total_installments}
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {transaction.category?.name || 'Sem categoria'}
          </span>
        </div>
      </div>

      {/* Amount & Date */}
      <div className="flex flex-col items-end gap-0.5">
        <span
          className={cn(
            'text-sm font-bold',
            isIncome ? 'text-income' : 'text-expense'
          )}
        >
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </span>
        <span className="text-[10px] font-medium text-slate-400">
          {formatDateRelative(transaction.transaction_date)}
        </span>
      </div>
    </div>
  );
});
