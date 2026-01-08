import { memo, useState } from 'react';
import { Wallet, MoreVertical, Edit3, ArrowLeftRight } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
  onEdit?: () => void;
  onTransfer?: () => void;
}

export const AccountCard = memo(function AccountCard({
  account,
  onClick,
  onEdit,
  onTransfer,
}: AccountCardProps) {
  const [showActions, setShowActions] = useState(false);
  const isCustomColor = !!account.color;
  
  // Define a cor do card (usa a cor da conta ou um fallback)
  const cardColor = account.color || '#64748b';

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleAction = (callback?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(false);
    callback?.();
  };

  const typeLabels: Record<string, string> = {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    investment: 'Investimento',
    cash: 'Dinheiro',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative list-card overflow-hidden h-full flex flex-col justify-between',
        onClick && 'cursor-pointer active:scale-[0.99] hover:shadow-md'
      )}
    >
      {/* Top color bar */}
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: cardColor }}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="icon-container-lg text-white shadow-md flex items-center justify-center"
            style={{ backgroundColor: cardColor }}
          >
             {/* Mostra as iniciais ou ícone padrão */}
            <span className="font-bold text-sm">
                {account.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="card-title">{account.name}</h4>
            <p className="label-overline mt-0.5 font-mono">
              {typeLabels[account.type] || account.type}
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={handleMenuClick}
            className="btn-icon touch-target"
            aria-label="Opções da conta"
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
                {onTransfer && (
                  <>
                     <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                    <button
                        onClick={handleAction(onTransfer)}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                        <ArrowLeftRight className="h-4 w-4 text-emerald-500" />
                        Transferir
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
          <p className="label-overline mb-1">Saldo Atual</p>
          <p className={cn(
            "value-display-lg tracking-tight",
            (account.current_balance || 0) < 0 ? "text-expense" : "text-slate-900 dark:text-white"
          )}>
            {formatCurrency(account.current_balance || 0)}
          </p>
        </div>
        <div className="text-right">
             <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700/50">
                <Wallet className="h-5 w-5 text-slate-400" />
             </div>
        </div>
      </div>
    </div>
  );
});