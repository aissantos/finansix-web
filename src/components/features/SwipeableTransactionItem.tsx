import { memo, useState, useRef } from 'react';
import { motion, useMotionValue, type PanInfo } from 'framer-motion';
import * as Icons from 'lucide-react';
import { Trash2, Edit3, Copy, Check } from 'lucide-react';
import { formatCurrency, formatDateRelative, cn } from '@/lib/utils';
import type { TransactionWithDetails } from '@/types';
import { Badge } from '@/components/ui/badge';

interface SwipeableTransactionItemProps {
  transaction: TransactionWithDetails;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onPay?: () => void;
}

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

export const SwipeableTransactionItem = memo(function SwipeableTransactionItem({
  transaction,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onPay,
}: SwipeableTransactionItemProps) {
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);
  const constraintsRef = useRef(null);

  const Icon = getIcon(transaction.category?.icon || 'default');
  const isIncome = transaction.type === 'income';
  const hasInstallments = transaction.is_installment && (transaction.total_installments ?? 0) > 1;
  const categoryColor = transaction.category?.color || ((isIncome || (transaction.type === 'transfer' && transaction.amount > 0)) ? '#22c55e' : '#ef4444');

  // Get current month's installment amount
  const currentInstallment = hasInstallments && transaction.installments?.length
    ? transaction.installments[0]
    : null;

  const displayAmount = currentInstallment
    ? currentInstallment.amount
    : transaction.amount;

  const installmentNumber = currentInstallment?.installment_number || 1;

  const isPendingStatus = transaction.status === 'pending';
  const canPay = onPay && isPendingStatus;

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x < -threshold) {
      // Swipe left - Delete
      if (onDelete) {
        if (navigator.vibrate) navigator.vibrate(50);
        onDelete();
      }
    } else if (info.offset.x > threshold) {
      // Swipe right - Pay or Edit
      if (canPay) {
        if (navigator.vibrate) navigator.vibrate([50, 50]); // Double vibration for success feel
        onPay();
      } else if (onEdit) {
        if (navigator.vibrate) navigator.vibrate(30);
        onEdit();
      }
    }
    
    // Reset position
    setIsRevealed(null);
  };

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-2xl h-[72px]">
      {/* Background Actions - BEHIND the card */}
      {/* Delete Action (Left) - Red background - LEFT HALF ONLY */}
      <div className="absolute inset-y-0 left-0 right-1/2 flex items-center justify-start px-6 bg-red-500 rounded-l-2xl">
        <div className="flex items-center gap-2 text-white">
          <Trash2 className="h-5 w-5" />
          <span className="font-semibold">Excluir</span>
        </div>
      </div>

      {/* Action (Right) - RIGHT HALF ONLY */}
      {/* If pending: Green/Pay. If completed: Blue/Edit (or potentially "Reopen") */}
      <div 
        className={cn(
          "absolute inset-y-0 left-1/2 right-0 flex items-center justify-end px-6 rounded-r-2xl transaction-swipe-action",
          isPendingStatus ? "bg-emerald-500" : "bg-blue-500"
        )}
      >
        <div className="flex items-center gap-2 text-white">
          <span className="font-semibold">{isPendingStatus ? 'Pagar' : 'Editar'}</span>
          {isPendingStatus ? <Check className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
        </div>
      </div>

      {/* Main Card - COVERS the backgrounds */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 150 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onTap={() => onClick?.()} 
        style={{ x, touchAction: 'none' }}
        className={cn(
          'absolute inset-0 list-card flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl',
          onClick && 'cursor-pointer'
        )}
        whileTap={{ scale: 0.98 }}
        animate={
          isRevealed === 'left'
            ? { x: -300, opacity: 0 }
            : isRevealed === 'right'
            ? { x: 300, opacity: 0 }
            : { x: 0, opacity: 1 }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
              {transaction.category?.name || 'Sem categoria'}
            </span>
          </div>
        </div>

        {/* Amount & Date */}
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={cn(
              'value-display-sm',
              (isIncome || (transaction.type === 'transfer' && displayAmount > 0)) 
                ? 'text-income' 
                : 'text-expense'
            )}
          >
            {(isIncome || (transaction.type === 'transfer' && displayAmount > 0)) ? '+' : '-'}{formatCurrency(Math.abs(displayAmount))}
          </span>
          <span className="label-overline">
            {formatDateRelative(transaction.transaction_date)}
          </span>
        </div>

        {/* Quick Action Button (visible on hover) */}
        {onDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity btn-icon touch-target"
            aria-label="Duplicar transação"
          >
            <Copy className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </motion.div>
    </div>
  );
});
