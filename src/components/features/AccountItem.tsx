import { memo, useState } from 'react';
import { Wallet, MoreVertical, Edit3, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { Account } from '@/types';

interface AccountItemProps {
  account: Account;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const accountTypeLabels: Record<string, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  investment: 'Investimento',
  cash: 'Dinheiro',
};

export const AccountItem = memo(function AccountItem({
  account,
  onClick,
  onEdit,
  onDelete,
}: AccountItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isNegative = (account.current_balance ?? 0) < 0;

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
        className="absolute top-0 left-0 w-full h-1"
        style={{ backgroundColor: account.color || '#3B82F6' }}
      />

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="icon-container-lg text-white shadow-md"
            style={{ backgroundColor: account.color || '#3B82F6' }}
          >
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="card-title">{account.name}</h4>
            <p className="label-overline mt-0.5">
              {accountTypeLabels[account.type] || account.type}
            </p>
          </div>
        </div>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={handleMenuClick}
            className="btn-icon touch-target"
            aria-label="Opções da conta"
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
      <div className="flex items-end justify-between">
        <div>
          <p className="label-overline mb-1">Saldo Atual</p>
          <p className={cn(
            'value-display-lg tracking-tight',
            isNegative ? 'text-expense' : 'text-slate-900 dark:text-white'
          )}>
            {formatCurrency(account.current_balance ?? 0)}
          </p>
        </div>
        {account.initial_balance !== undefined && account.initial_balance !== account.current_balance && (
          <div className="text-right">
            <p className="label-overline mb-1">Inicial</p>
            <p className="value-display-sm text-slate-500">
              {formatCurrency(account.initial_balance)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});