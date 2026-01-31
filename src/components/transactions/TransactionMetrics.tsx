import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface TransactionMetricsProps {
  totals: {
    income: number;
    expense: number;
    net: number;
  };
}

export function TransactionMetrics({ totals }: TransactionMetricsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Receitas</p>
        </div>
        <p className="text-sm font-black text-slate-900 dark:text-white">
          {formatCurrency(totals.income)}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <ArrowUpRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Despesas</p>
        </div>
        <p className="text-sm font-black text-slate-900 dark:text-white">
          {formatCurrency(totals.expense)}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
            <Wallet className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Saldo</p>
        </div>
        <p className={cn(
          'text-sm font-black',
          totals.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        )}>
          {formatCurrency(totals.net)}
        </p>
      </div>
    </div>
  );
}
