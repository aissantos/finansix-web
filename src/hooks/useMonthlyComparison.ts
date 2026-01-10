import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useHouseholdId, useSelectedMonth } from '@/stores';

interface MonthlyData {
  income: number;
  expenses: number;
  balance: number;
}

interface MonthlyComparison {
  currentMonth: MonthlyData;
  previousMonth: MonthlyData;
  difference: {
    income: number;
    incomePercent: number;
    expenses: number;
    expensesPercent: number;
    balance: number;
    balancePercent: number;
  };
  isSpendingMore: boolean;
  isSavingMore: boolean;
}

async function getMonthlyData(
  householdId: string,
  monthDate: Date
): Promise<MonthlyData> {
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');
  const end = format(endOfMonth(monthDate), 'yyyy-MM-dd');

  // Buscar transações do mês
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('household_id', householdId)
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching monthly data:', error);
    return { income: 0, expenses: 0, balance: 0 };
  }

  type TransactionRow = { type: string; amount: number };
  const txList = (transactions ?? []) as TransactionRow[];

  const income = txList
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const expenses = txList
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  return {
    income,
    expenses,
    balance: income - expenses,
  };
}

export function useMonthlyComparison() {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();

  return useQuery({
    queryKey: ['monthlyComparison', householdId, format(selectedMonth, 'yyyy-MM')],
    queryFn: async (): Promise<MonthlyComparison> => {
      const previousMonthDate = subMonths(selectedMonth, 1);

      const [currentMonth, previousMonth] = await Promise.all([
        getMonthlyData(householdId!, selectedMonth),
        getMonthlyData(householdId!, previousMonthDate),
      ]);

      // Calcular diferenças
      const incomeDiff = currentMonth.income - previousMonth.income;
      const expensesDiff = currentMonth.expenses - previousMonth.expenses;
      const balanceDiff = currentMonth.balance - previousMonth.balance;

      // Calcular percentuais (evitar divisão por zero)
      const incomePercent = previousMonth.income > 0
        ? (incomeDiff / previousMonth.income) * 100
        : currentMonth.income > 0 ? 100 : 0;

      const expensesPercent = previousMonth.expenses > 0
        ? (expensesDiff / previousMonth.expenses) * 100
        : currentMonth.expenses > 0 ? 100 : 0;

      const balancePercent = previousMonth.balance !== 0
        ? (balanceDiff / Math.abs(previousMonth.balance)) * 100
        : currentMonth.balance !== 0 ? 100 : 0;

      return {
        currentMonth,
        previousMonth,
        difference: {
          income: incomeDiff,
          incomePercent,
          expenses: expensesDiff,
          expensesPercent,
          balance: balanceDiff,
          balancePercent,
        },
        isSpendingMore: expensesDiff > 0,
        isSavingMore: balanceDiff > 0,
      };
    },
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar totais dos últimos N meses (para gráficos)
 */
export function useMonthlyTrend(months: number = 6) {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();

  return useQuery({
    queryKey: ['monthlyTrend', householdId, months, format(selectedMonth, 'yyyy-MM')],
    queryFn: async () => {
      const trends: Array<{
        month: string;
        label: string;
        income: number;
        expenses: number;
        balance: number;
      }> = [];

      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(selectedMonth, i);
        const data = await getMonthlyData(householdId!, monthDate);
        
        trends.push({
          month: format(monthDate, 'yyyy-MM'),
          label: format(monthDate, 'MMM'),
          ...data,
        });
      }

      return trends;
    },
    enabled: !!householdId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}
