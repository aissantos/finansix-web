import type { ReactNode } from 'react';
import { useState } from 'react';
import { MoreVertical, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface ListCardProps {
  /** Ícone ou elemento à esquerda */
  icon?: ReactNode;
  /** Cor de fundo do ícone */
  iconBg?: string;
  /** Cor do ícone */
  iconColor?: string;
  /** Título principal */
  title: string;
  /** Subtítulo/descrição */
  subtitle?: string;
  /** Valor monetário a exibir */
  value?: number;
  /** Tipo do valor (afeta cor) */
  valueType?: 'income' | 'expense' | 'default';
  /** Formatador de valor customizado */
  formatValue?: (value: number) => string;
  /** Badge/tag adicional */
  badge?: ReactNode;
  /** Elemento trailing (direita) */
  trailing?: ReactNode;
  /** Mostra chevron à direita */
  showChevron?: boolean;
  /** Mostra menu de ações */
  showMenu?: boolean;
  /** Callback ao clicar no card */
  onPress?: () => void;
  /** Callback ao clicar em editar */
  onEdit?: () => void;
  /** Callback ao clicar em excluir */
  onDelete?: () => void;
  /** Items customizados do menu */
  menuItems?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
  /** Classes adicionais */
  className?: string;
  /** Desabilita interação */
  disabled?: boolean;
}

export function ListCard({
  icon,
  iconBg = 'bg-slate-100 dark:bg-slate-700',
  iconColor = 'text-slate-600 dark:text-slate-400',
  title,
  subtitle,
  value,
  valueType = 'default',
  formatValue,
  badge,
  trailing,
  showChevron = false,
  showMenu = false,
  onPress,
  onEdit,
  onDelete,
  menuItems,
  className,
  disabled = false,
}: ListCardProps) {
  const [showActions, setShowActions] = useState(false);

  const isInteractive = !!onPress && !disabled;

  const valueColorClass = {
    income: 'text-income',
    expense: 'text-expense',
    default: 'text-slate-900 dark:text-white',
  }[valueType];

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleAction = (callback?: () => void) => {
    setShowActions(false);
    callback?.();
  };

  // Build menu items
  const allMenuItems = menuItems || [];
  if (onEdit && !menuItems) {
    allMenuItems.push({
      label: 'Editar',
      icon: <Edit3 className="h-4 w-4" />,
      onClick: onEdit,
    });
  }
  if (onDelete && !menuItems) {
    allMenuItems.push({
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'danger',
    });
  }

  return (
    <div
      onClick={isInteractive ? onPress : undefined}
      className={cn(
        'list-card',
        isInteractive && 'list-card-interactive',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        {icon && (
          <div className={cn('icon-container-lg', iconBg, iconColor)}>
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="card-title truncate">{title}</span>
            {badge}
          </div>
          {subtitle && (
            <span className="card-subtitle block truncate">{subtitle}</span>
          )}
        </div>

        {/* Value */}
        {value !== undefined && (
          <div className="text-right flex-shrink-0">
            <span className={cn('value-display-sm', valueColorClass)}>
              {valueType === 'income' && '+ '}
              {valueType === 'expense' && '- '}
              {formatValue ? formatValue(value) : formatCurrency(value)}
            </span>
          </div>
        )}

        {/* Trailing */}
        {trailing}

        {/* Chevron */}
        {showChevron && !showMenu && (
          <ChevronRight className="h-5 w-5 text-slate-300 flex-shrink-0" />
        )}

        {/* Menu */}
        {showMenu && allMenuItems.length > 0 && (
          <div className="relative">
            <button
              onClick={handleMenuClick}
              className="btn-icon touch-target"
              aria-label="Mais opções"
              aria-expanded={showActions}
            >
              <MoreVertical className="h-5 w-5 text-slate-400" />
            </button>

            {/* Dropdown */}
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-150">
                  {allMenuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(item.onClick)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors',
                        item.variant === 'danger'
                          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      )}
                    >
                      {item.icon && (
                        <span className={item.variant === 'danger' ? '' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                      )}
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Variante para cards financeiros com valor destacado
interface FinancialCardProps extends Omit<ListCardProps, 'value' | 'valueType'> {
  /** Valor principal */
  amount: number;
  /** Tipo da transação */
  type: 'income' | 'expense';
  /** Data/hora */
  date?: string;
}

export function FinancialCard({
  amount,
  type,
  date,
  ...props
}: FinancialCardProps) {
  return (
    <ListCard
      {...props}
      value={amount}
      valueType={type}
      trailing={
        date ? (
          <div className="text-right">
            <span className={cn('value-display-sm', type === 'income' ? 'text-income' : 'text-expense')}>
              {type === 'income' ? '+' : '-'} {formatCurrency(amount)}
            </span>
            <span className="label-overline block mt-0.5">{date}</span>
          </div>
        ) : undefined
      }
    />
  );
}
