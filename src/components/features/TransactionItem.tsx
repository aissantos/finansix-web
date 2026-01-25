import { memo, useState } from 'react';
import * as Icons from 'lucide-react';
import { MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { formatCurrency, formatDateRelative, cn } from '@/lib/utils';
import type { TransactionWithDetails } from '@/types';
import { Badge } from '@/components/ui/badge';

interface TransactionItemProps {
  transaction: TransactionWithDetails;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
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
  onEdit,
  onDelete,
}: TransactionItemProps) {
  const [showActions, setShowActions] = useState(false);
  
  const Icon = getIcon(transaction.category?.icon || 'default');
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';
  const hasInstallments = transaction.is_installment && (transaction.total_installments ?? 0) > 1;
  
  // Color: Green for income/positive transfer, Red for expense/negative transfer
  const categoryColor = transaction.category?.color || ((isIncome || (isTransfer && transaction.amount > 0)) ? '#22c55e' : '#ef4444');

  // Get current month's installment (if installment transaction)
  const currentInstallment = hasInstallments && transaction.installments?.length
    ? transaction.installments[0]
    : null;

  // Display amount: installment amount if exists, otherwise transaction amount
  const displayAmount = currentInstallment
    ? currentInstallment.amount
    : transaction.amount;

  // Display installment info
  const installmentNumber = currentInstallment?.installment_number || 1;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleAction = (callback?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    callback?.();
  };

  const hasMenu = onEdit || onDelete;

  return (
    <div
      onClick={onClick}
      className={cn(
        'list-card flex items-center justify-between',
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.99]'
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div
          className="icon-container-lg flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="card-title truncate">
              {transaction.description}
            </span>
            {hasInstallments && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                {installmentNumber}/{transaction.total_installments}
              </Badge>
            )}
          </div>
          <span className="card-subtitle truncate">
            {transaction.category?.name || (isTransfer ? 'Transferência' : 'Sem categoria')}
          </span>
        </div>
      </div>

      {/* Amount & Date & Menu */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={cn(
              'value-display-sm',
              (isIncome || (isTransfer && displayAmount > 0)) ? 'text-income' : 'text-expense'
            )}
          >
            {(isIncome || (isTransfer && displayAmount > 0)) ? '+' : '-'}{formatCurrency(Math.abs(displayAmount))}
          </span>
          <span className="label-overline">
            {formatDateRelative(transaction.transaction_date)}
          </span>
        </div>

        {/* Menu */}
        {hasMenu && (
          <div className="relative">
            <button
              onClick={handleMenuClick}
              className="btn-icon touch-target"
              aria-label="Opções da transação"
              aria-expanded={showActions}
            >
              <MoreVertical className="h-5 w-5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-150">
                  {onEdit && (
                    <button
                      onClick={handleAction(onEdit)}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Edit3 className="h-4 w-4 text-slate-400" />
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <>
                      {onEdit && <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />}
                      <button
                        onClick={handleAction(onDelete)}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
