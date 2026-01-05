import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { useFreeBalance } from '@/hooks';
import { formatCurrency, cn, getBalanceColor } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function BalanceHero() {
  const [isVisible, setIsVisible] = useState(true);
  const { data, isLoading } = useFreeBalance();

  if (isLoading) {
    return <BalanceHeroSkeleton />;
  }

  const balance = data?.freeBalance ?? 0;
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
          'flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border',
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

      {/* Breakdown tooltip trigger could go here */}
    </section>
  );
}

function BalanceHeroSkeleton() {
  return (
    <section className="flex flex-col items-center justify-center text-center">
      <Skeleton className="h-4 w-40 mb-2" />
      <Skeleton className="h-10 w-48 mb-2" />
      <Skeleton className="h-6 w-28 rounded-full" />
    </section>
  );
}
