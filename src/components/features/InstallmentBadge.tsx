import { cn } from '@/lib/utils';

interface InstallmentBadgeProps {
  current: number;
  total: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Badge visual para mostrar parcelas (ex: "2/10")
 * Usado em listas de transações para feedback imediato
 */
export function InstallmentBadge({ 
  current, 
  total, 
  size = 'sm',
  className 
}: InstallmentBadgeProps) {
  const isLastInstallment = current === total;
  const isFirstInstallment = current === 1;
  
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-full',
        size === 'sm' 
          ? 'text-[10px] px-1.5 py-0.5 gap-0.5' 
          : 'text-xs px-2 py-1 gap-1',
        isLastInstallment
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : isFirstInstallment
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        className
      )}
    >
      <span className="font-black">{current}</span>
      <span className="opacity-50">/</span>
      <span>{total}</span>
    </span>
  );
}

/**
 * Versão inline para uso em texto
 */
export function InstallmentText({ 
  current, 
  total,
  className 
}: Omit<InstallmentBadgeProps, 'size'>) {
  return (
    <span className={cn('text-slate-500 text-xs', className)}>
      Parcela {current} de {total}
    </span>
  );
}
