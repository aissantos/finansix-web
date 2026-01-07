import { memo } from 'react';
import { CreditCard, MoreHorizontal } from 'lucide-react';
import { formatCurrency, formatCardNumber, cn } from '@/lib/utils';
import type { CreditCardWithLimits } from '@/types';

interface CreditCardItemProps {
  card: CreditCardWithLimits;
  onClick?: () => void;
}

// Card brand colors
const brandColors: Record<string, string> = {
  nubank: 'bg-[#820AD1]',
  inter: 'bg-[#FF7A00]',
  itau: 'bg-[#EC7000]',
  bradesco: 'bg-[#cc092f]',
  santander: 'bg-[#ec0000]',
  bb: 'bg-[#fdcb00]',
  caixa: 'bg-[#005ca9]',
  c6: 'bg-[#1a1a1a]',
  xp: 'bg-[#101622]',
  default: 'bg-slate-700',
};

function getCardColor(card: CreditCardWithLimits): string {
  if (card.color) return card.color;
  const brand = card.brand?.toLowerCase() || '';
  for (const [key, color] of Object.entries(brandColors)) {
    if (brand.includes(key)) return color;
  }
  return brandColors.default;
}

export const CreditCardItem = memo(function CreditCardItem({
  card,
  onClick,
}: CreditCardItemProps) {
  const usagePercent = (card.used_limit / card.credit_limit) * 100;
  const cardColor = getCardColor(card);
  const isCustomColor = card.color?.startsWith('#') || card.color?.startsWith('rgb');

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden transition-transform',
        onClick && 'cursor-pointer active:scale-[0.98]'
      )}
    >
      {/* Top color bar */}
      <div
        className={cn('absolute top-0 left-0 w-full h-1.5', !isCustomColor && cardColor)}
        style={isCustomColor ? { backgroundColor: card.color! } : undefined}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-12 w-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md',
              !isCustomColor && cardColor
            )}
            style={isCustomColor ? { backgroundColor: card.color! } : undefined}
          >
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
              {card.name}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-mono">
              {card.brand} {card.last_four_digits && formatCardNumber(card.last_four_digits)}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            // Open menu
          }}
          className="h-8 w-8 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Values */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Fatura Atual
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(card.used_limit)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Disponível
          </p>
          <p className="text-sm font-bold text-income">
            {formatCurrency(card.available_limit)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]',
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
        <span className="text-[9px] font-bold text-slate-400 uppercase">
          Limite: {formatCurrency(card.credit_limit)}
        </span>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
          {Math.round(usagePercent)}% usado
        </span>
      </div>
    </div>
  );
});
