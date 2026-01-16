import { useState } from 'react';
import { Calendar, CreditCard, MoreVertical, Edit3, Trash2, Pause, Play } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { Subscription } from '@/hooks/useSubscriptions';

interface SubscriptionItemProps {
  subscription: Subscription;
  card?: { name: string; last_four_digits: string | null };
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  onClick?: () => void;
}

export function SubscriptionItem({ 
  subscription, 
  card, 
  onEdit, 
  onDelete,
  onToggleActive,
  onClick
}: SubscriptionItemProps) {
  const [showActions, setShowActions] = useState(false);
  
  const today = new Date().getDate();
  const daysUntilBilling = subscription.billing_day >= today
    ? subscription.billing_day - today
    : 30 - today + subscription.billing_day;
  
  const isUpcoming = daysUntilBilling <= 3 && subscription.is_active;
  const isToday = daysUntilBilling === 0;

  const hasActions = Boolean(onEdit || onDelete || onToggleActive);

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border transition-all',
        subscription.is_active
          ? 'border-slate-100 dark:border-slate-700'
          : 'border-slate-200 dark:border-slate-600 opacity-60',
        isUpcoming && 'ring-2 ring-amber-500/20',
        onClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-[0.99]'
      )}
    >
      <div className="p-4">
        <div className="flex gap-4">
          {/* Icon with status indicator */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center text-2xl transition-all",
              isUpcoming 
                ? "bg-amber-50 dark:bg-amber-900/30" 
                : "bg-slate-100 dark:bg-slate-700"
            )}>
              {subscription.icon || '📦'}
            </div>
            {!subscription.is_active && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-slate-400 rounded-full flex items-center justify-center">
                <Pause className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 dark:text-white truncate">
                  {subscription.name}
                </h4>
                {card && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <CreditCard className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500 truncate">
                      {card.name} {card.last_four_digits && `••${card.last_four_digits}`}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Amount */}
              <div className="text-right flex-shrink-0">
                <p className="font-black text-lg text-slate-900 dark:text-white">
                  {formatCurrency(subscription.amount ?? 0)}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">/mês</p>
              </div>
            </div>
            
            {/* Bottom row */}
            <div className="flex items-center justify-between mt-3">
              {/* Billing info */}
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                isToday
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : isUpcoming
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-700"
              )}>
                <Calendar className="h-3 w-3" />
                {isToday ? (
                  <span>Cobra hoje!</span>
                ) : isUpcoming ? (
                  <span>Em {daysUntilBilling} dia{daysUntilBilling > 1 ? 's' : ''}</span>
                ) : (
                  <span>Dia {subscription.billing_day}</span>
                )}
              </div>
              
              {/* Actions */}
              {hasActions && (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  
                  {/* Dropdown */}
                  {showActions && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowActions(false)} 
                      />
                      <div className="absolute right-0 bottom-full mb-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[140px]">
                        {onEdit && (
                          <button
                            onClick={() => { onEdit(); setShowActions(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Edit3 className="h-4 w-4 text-slate-400" />
                            Editar
                          </button>
                        )}
                        {onToggleActive && (
                          <button
                            onClick={() => { onToggleActive(); setShowActions(false); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                          >
                            {subscription.is_active ? (
                              <>
                                <Pause className="h-4 w-4 text-slate-400" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 text-slate-400" />
                                Reativar
                              </>
                            )}
                          </button>
                        )}
                        {onDelete && (
                          <>
                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                            <button
                              onClick={() => { onDelete(); setShowActions(false); }}
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
        </div>
      </div>
      
      {/* Upcoming banner */}
      {isUpcoming && (
        <div className={cn(
          "px-4 py-2 text-xs font-medium flex items-center justify-between",
          isToday 
            ? "bg-red-500 text-white" 
            : "bg-amber-500 text-white"
        )}>
          <span>
            {isToday 
              ? '⚡ Cobrança hoje!' 
              : `⏰ Cobrança em ${daysUntilBilling} dia${daysUntilBilling > 1 ? 's' : ''}`
            }
          </span>
          <span className="opacity-80">
            {formatCurrency(subscription.amount ?? 0)}
          </span>
        </div>
      )}
    </div>
  );
}
