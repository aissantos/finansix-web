import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useTransactions, useAccounts, useInstallments } from '@/hooks';
import { formatCurrency, cn } from '@/lib/utils';
import { addDays, format, endOfMonth, eachDayOfInterval } from 'date-fns';

interface BalancePrediction {
  date: Date;
  predictedBalance: number;
  confidence: number;
}

export function BalanceForecaster() {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: installments = [] } = useInstallments();

  const forecast = useMemo(() => {
    return calculateBalanceForecast(accounts, transactions, installments);
  }, [accounts, transactions, installments]);

  const currentBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  const endOfMonthPrediction = forecast[forecast.length - 1];
  const balanceChange = endOfMonthPrediction.predictedBalance - currentBalance;
  const isPositive = balanceChange >= 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Previsão de Saldo
          </h3>
          <p className="text-xs text-slate-500">Projeção até o fim do mês</p>
        </div>
      </div>

      <Card className="p-5 glass-card">
        {/* Prediction Chart */}
        <div className="mb-4">
          <div className="flex items-end justify-between h-32 gap-1">
            {forecast.map((prediction, index) => {
              const maxBalance = Math.max(...forecast.map(p => p.predictedBalance));
              const minBalance = Math.min(...forecast.map(p => p.predictedBalance));
              const range = maxBalance - minBalance || 1;
              const height = ((prediction.predictedBalance - minBalance) / range) * 100;
              
              const isToday = format(prediction.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <motion.div
                  key={index}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '100%', opacity: 1 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className="relative flex-1 group"
                >
                  <div className="relative w-full bg-slate-100 dark:bg-slate-700 rounded-t h-full overflow-hidden">
                    <div
                      className={cn(
                        'absolute bottom-0 w-full rounded-t transition-all',
                        isToday
                          ? 'bg-primary'
                          : prediction.predictedBalance >= currentBalance
                          ? 'bg-green-400'
                          : 'bg-red-400',
                        'opacity-70 group-hover:opacity-100'
                      )}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {formatCurrency(prediction.predictedBalance)}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Prediction Summary */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Saldo Atual
            </span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(currentBalance)}
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Previsão (Fim do Mês)
            </span>
            <span className={cn(
              'text-sm font-bold',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(endOfMonthPrediction.predictedBalance)}
            </span>
          </div>

          {/* Insight Message */}
          <div className={cn(
            'flex items-start gap-2 p-3 rounded-lg',
            isPositive
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30'
          )}>
            {isPositive ? (
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={cn(
                'text-xs font-medium',
                isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              )}>
                {isPositive ? (
                  <>
                    Você terá <strong>{formatCurrency(Math.abs(balanceChange))}</strong> a mais
                  </>
                ) : (
                  <>
                    Atenção: Redução de <strong>{formatCurrency(Math.abs(balanceChange))}</strong>
                  </>
                )}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Baseado em {transactions.length} transações e {installments.length} parcelas pendentes
                • Confiança: {Math.round(endOfMonthPrediction.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

/**
 * Calculate balance forecast using simple ML-like approach
 * Factors:
 * 1. Current balance
 * 2. Pending installments (known)
 * 3. Expected recurring transactions (pattern-based)
 * 4. Historical spending patterns
 */
function calculateBalanceForecast(
  accounts: any[],
  transactions: any[],
  installments: any[]
): BalancePrediction[] {
  const currentBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  const today = new Date();
  const endOfCurrentMonth = endOfMonth(today);
  
  // Generate daily predictions
  const days = eachDayOfInterval({ start: today, end: endOfCurrentMonth });
  const predictions: BalancePrediction[] = [];

  // Calculate daily average spending from last 30 days
  const last30Days = transactions.filter(tx => {
    const txDate = new Date(tx.transaction_date);
    return txDate >= addDays(today, -30) && tx.type === 'expense';
  });
  
  const dailyAverageSpending = last30Days.length > 0
    ? last30Days.reduce((sum, tx) => sum + tx.amount, 0) / 30
    : 0;

  // Calculate daily average income
  const incomeTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.transaction_date);
    return txDate >= addDays(today, -30) && tx.type === 'income';
  });
  
  const dailyAverageIncome = incomeTransactions.length > 0
    ? incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0) / 30
    : 0;

  let runningBalance = currentBalance;

  for (const day of days) {
    // Check for pending installments on this day
    const dayInstallments = installments.filter(inst => {
      const dueDate = new Date(inst.due_date);
      return format(dueDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && inst.status === 'pending';
    });

    const installmentPayments = dayInstallments.reduce((sum, inst) => sum + inst.amount, 0);

    // Predict balance change
    const expectedIncome = dailyAverageIncome;
    const expectedExpenses = dailyAverageSpending;
    
    runningBalance = runningBalance + expectedIncome - expectedExpenses - installmentPayments;

    // Calculate confidence based on data availability
    const confidence = Math.min(
      (transactions.length / 100) * 0.5 + // More transactions = higher confidence
      (installments.length > 0 ? 0.3 : 0) + // Known installments boost confidence
      0.2, // Base confidence
      1.0
    );

    predictions.push({
      date: day,
      predictedBalance: runningBalance,
      confidence,
    });
  }

  return predictions;
}
