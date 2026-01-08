import { memo, useState } from 'react';
import { Calendar, MoreVertical, Edit3, Trash2, Pause, Play, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { Subscription } from '@/hooks/useSubscriptions';

interface SubscriptionCardProps {
  subscription: Subscription;
  cardName?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
}

export const SubscriptionCard = memo(function SubscriptionCard({
  subscription,
  cardName,
  onClick,
  onEdit,
  onDelete,
  onToggleActive,
}: SubscriptionCardProps) {
  const [showActions, setShowActions] = useState(false);

  // Lógica de Data
  const today = new Date().getDate();
  const daysUntilBilling = subscription.billing_day >= today
    ? subscription.billing_day - today
    : 30 - today + subscription.billing_day;
  
  const isUpcoming = daysUntilBilling <= 3 && subscription.is_active;
  const isToday = daysUntilBilling === 0;
  
  // Cores dinâmicas baseadas no status
  const statusColor = isToday 
    ? 'bg-red-500' 
    : isUpcoming 
        ? 'bg-amber-500' 
        : subscription.is_active 
            ? 'bg-blue-500' 
            : 'bg-slate-400';

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleAction = (callback?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    callback?.();
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative list-card overflow-hidden h-full flex flex-col justify-between group',
        !subscription.is_active && 'opacity-70 grayscale-[0.5]',
        onClick && 'cursor-pointer active:scale-[0.99] hover:shadow-md'
      )}
    >
      {/* Top color bar */}
      <div
        className={cn("absolute top-0 left-0 w-full h-1 transition-colors", statusColor)}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
              "icon-container-lg shadow-md flex items-center justify-center text-xl",
              "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
          )}>
            {subscription.icon || '📦'}
            {isUpcoming && subscription.is_active && (
                 <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </div>
          <div>
            <h4 className="card-title truncate max-w-[120px]">{subscription.name}</h4>
            <p className="label-overline mt-0.5 truncate max-w-[120px]">
              {cardName || 'Sem cartão vinculado'}
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={handleMenuClick}
            className="btn-icon touch-target"
            aria-label="Opções"
          >
            <MoreVertical className="h-5 w-5 text-slate-400" />
          </button>

          {/* Dropdown */}
          {showActions && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => { e.stopPropagation(); setShowActions(false); }}
              />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[150px] animate-in fade-in slide-in-from-top-2 duration-150">
                {onEdit && (
                  <button
                    onClick={handleAction(onEdit)}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4 text-slate-400" />
                    Editar
                  </button>
                )}
                {onToggleActive && (
                  <button
                    onClick={handleAction(onToggleActive)}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    {subscription.is_active ? (
                        <>
                            <Pause className="h-4 w-4 text-slate-400" />
                            Pausar
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4 text-emerald-500" />
                            Reativar
                        </>
                    )}
                  </button>
                )}
                {onDelete && (
                  <>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
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
      </div>

      {/* Values */}
      <div className="flex items-end justify-between mt-auto">
        <div>
          <p className="label-overline mb-1">Mensalidade</p>
          <p className="value-display-lg tracking-tight">
            {formatCurrency(subscription.amount)}
          </p>
        </div>
        <div className="text-right">
          <p className="label-overline mb-1 text-right">Vencimento</p>
           <div className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold",
             isToday
               ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
               : isUpcoming
                 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                 : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
           )}>
             <Calendar className="h-3 w-3" />
             {isToday ? 'Hoje!' : `Dia ${subscription.billing_day}`}
           </div>
        </div>
      </div>
    </div>
  );
});