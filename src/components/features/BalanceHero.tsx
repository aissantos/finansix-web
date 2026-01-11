import { Eye, EyeOff, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useState } from 'react';
import { useFreeBalance, useTotalBalance } from '@/hooks';
import { formatCurrency, cn, getBalanceColor } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function BalanceHero() {
  const [isVisible, setIsVisible] = useState(false); // ← Inicia ocultado
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { data, isLoading } = useFreeBalance();
  const { data: accountBalance, isLoading: accountLoading } = useTotalBalance();

  if (isLoading || accountLoading) {
    return <BalanceHeroSkeleton />;
  }

  const balance = accountBalance ?? 0; // ✅ Usar saldo em contas
  const isPositive = balance >= 0;

  return (
    <section className="flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-slate-500 text-sm font-medium">Saldo Livre Disponível</span>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-slate-400 hover:text-primary transition-colors"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      <h2
        className={cn(
          'text-4xl font-extrabold tracking-tight transition-all',
          getBalanceColor(balance)
        )}
      >
        {isVisible ? formatCurrency(balance) : '••••••'}
      </h2>

      <div
        className={cn(
          'flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full border',
          isPositive
            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30'
            : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30'
        )}
      >
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
        <p
          className={cn(
            'text-xs font-bold',
            isPositive
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-700 dark:text-red-400'
          )}
        >
          {isPositive ? 'Saldo positivo' : 'Saldo negativo'}
        </p>
      </div>

      {/* Breakdown Card */}
      {showBreakdown && data && isVisible && (
        <Card className="mt-4 p-4 w-full max-w-sm text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Composição do Saldo
          </h4>
          <div className="space-y-2">
            {data.breakdown.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {item.label}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    item.type === 'positive' ? 'text-income' : 'text-expense'
                  )}
                >
                  {item.value >= 0 ? '+' : ''}{formatCurrency(item.value)}
                </span>
              </div>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Saldo Livre
                </span>
                <span className={cn('text-sm font-black', getBalanceColor(balance))}>
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </section>
  );
}

function BalanceHeroSkeleton() {
  return (
    <section className="flex flex-col items-center justify-center text-center">
      <Skeleton className="h-6 w-48 mb-3 rounded-full" />
      <Skeleton className="h-4 w-40 mb-2" />
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-6 w-28 rounded-full" />
    </section>
  );
}
