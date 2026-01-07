import { Calendar, CreditCard, Edit3, Trash2, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { Subscription } from '@/hooks/useSubscriptions';

interface SubscriptionItemProps {
  subscription: Subscription;
  card?: { name: string; last_four_digits: string | null }; // Ajustado para match com DB
  onEdit: () => void;
  onDelete: () => void;
}

export function SubscriptionItem({ subscription, card, onEdit, onDelete }: SubscriptionItemProps) {
  const today = new Date().getDate();
  const daysUntilBilling = subscription.billing_day >= today
    ? subscription.billing_day - today
    : 30 - today + subscription.billing_day;
  
  const isUpcoming = daysUntilBilling <= 3;

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all',
        subscription.is_active
          ? 'border-slate-100 dark:border-slate-700'
          : 'border-slate-200 dark:border-slate-600 opacity-60'
      )}
    >
      <div className="flex gap-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl">
            {subscription.icon || '📦'}
          </div>
          {isUpcoming && subscription.is_active && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 rounded-full flex items-center justify-center">
              <AlertCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {subscription.name}
              </h4>
              {card && (
                <p className="text-xs text-slate-500 mt-0.5">
                  <CreditCard className="h-3 w-3 inline mr-1" />
                  {card.name} ••{card.last_four_digits}
                </p>
              )}
            </div>
            <p className="font-bold text-slate-900 dark:text-white">
              {formatCurrency(subscription.amount)}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-[10px] font-bold px-2 py-1 rounded-full',
                isUpcoming && subscription.is_active
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
              )}>
                <Calendar className="h-3 w-3 inline mr-1" />
                Dia {subscription.billing_day}
              </span>
              {!subscription.is_active && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-500">
                  Pausada
                </span>
              )}
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}