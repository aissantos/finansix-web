import { memo, useState } from 'react';
import { CreditCard, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { formatCurrency, formatCardNumber, cn } from '@/lib/utils';
import type { CreditCardWithLimits } from '@/types';

interface CreditCardItemProps {
  card: CreditCardWithLimits;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Card brand colors - usando classes do tailwind config
const brandColors: Record<string, string> = {
  nubank: 'bg-card-nubank',
  inter: 'bg-card-inter',
  itau: 'bg-card-itau',
  bradesco: 'bg-card-bradesco',
  c6: 'bg-card-c6',
  xp: 'bg-card-xp',
  default: 'bg-slate-700',
};

function getCardColor(card: CreditCardWithLimits): string {
  if (card.color) return card.color;
  const name = card.name?.toLowerCase() || '';
  for (const [key, color] of Object.entries(brandColors)) {
    if (name.includes(key)) return color;
  }
  return brandColors.default;
}

export const CreditCardItem = memo(function CreditCardItem({
  card,
  onClick,
  onEdit,
  onDelete,
}: CreditCardItemProps) {
  const [showActions, setShowActions] = useState(false);
  const usagePercent = (card.used_limit / card.credit_limit) * 100;
  const cardColor = getCardColor(card);
  const isCustomColor = card.color?.startsWith('#') || card.color?.startsWith('rgb');

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
        'relative list-card overflow-hidden',
        onClick && 'cursor-pointer active:scale-[0.99] hover:shadow-md'
      )}
    >
      {/* Top color bar */}
      <div
        className={cn('absolute top-0 left-0 w-full h-1', !isCustomColor && cardColor)}
        style={isCustomColor ? { backgroundColor: card.color! } : undefined}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'icon-container-lg text-white shadow-md',
              !isCustomColor && cardColor
            )}
            style={isCustomColor ? { backgroundColor: card.color! } : undefined}
          >
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h4 className="card-title">{card.name}</h4>
            <p className="label-overline mt-0.5 font-mono">
              {card.brand} {card.last_four_digits && formatCardNumber(card.last_four_digits)}
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={handleMenuClick}
            className="btn-icon touch-target"
            aria-label="Opções do cartão"
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
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="label-overline mb-1">Fatura Atual</p>
          <p className="value-display-lg tracking-tight">
            {formatCurrency(card.used_limit)}
          </p>
        </div>
        <div className="text-right">
          <p className="label-overline mb-1">Disponível</p>
          <p className="value-display-sm text-income">
            {formatCurrency(card.available_limit)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out',
            !isCustomColor && cardColor
          )}
          style={{
            width: `${Math.min(usagePercent, 100)}%`,
            ...(isCustomColor ? { backgroundColor: card.color! } : {}),
          }}
        />
      </div>

      {/* Footer */}
      <div className="mt-2 flex justify-between">
        <span className="label-overline">
          Limite: {formatCurrency(card.credit_limit)}
        </span>
        <span className="label-overline">
          {Math.round(usagePercent)}% usado
        </span>
      </div>
    </div>
  );
});
