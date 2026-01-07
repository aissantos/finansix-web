import { 
  differenceInDays, 
  getDaysInMonth, 
  startOfMonth,
  format 
} from 'date-fns';
import type { 
  CreditCardWithLimits, 
  CardRecommendation, 
  FreeBalanceResult,
  BalanceBreakdownItem 
} from '@/types';
import { supabase } from '@/lib/supabase/client';

// ============================================
// BEST CARD ALGORITHM
// ============================================

interface BillingDates {
  closingDate: Date;
  dueDate: Date;
}

function calculateBillingDates(
  card: CreditCardWithLimits,
  purchaseDate: Date
): BillingDates {
  const purchaseDay = purchaseDate.getDate();
  const purchaseMonth = purchaseDate.getMonth();
  const purchaseYear = purchaseDate.getFullYear();

  let closingMonth = purchaseMonth;
  let closingYear = purchaseYear;

  // If purchase is AFTER closing day, goes to next billing cycle
  if (purchaseDay > card.closing_day) {
    closingMonth += 1;
    if (closingMonth > 11) {
      closingMonth = 0;
      closingYear += 1;
    }
  }

  // Calculate closing date (adjust for months with fewer days)
  const daysInClosingMonth = getDaysInMonth(new Date(closingYear, closingMonth));
  const closingDate = new Date(
    closingYear,
    closingMonth,
    Math.min(card.closing_day, daysInClosingMonth)
  );

  // Due date is typically in the month after closing
  let dueMonth = closingMonth + 1;
  let dueYear = closingYear;
  if (dueMonth > 11) {
    dueMonth = 0;
    dueYear += 1;
  }

  const daysInDueMonth = getDaysInMonth(new Date(dueYear, dueMonth));
  const dueDate = new Date(
    dueYear,
    dueMonth,
    Math.min(card.due_day, daysInDueMonth)
  );

  return { closingDate, dueDate };
}

export function getBestCard(
  cards: CreditCardWithLimits[],
  purchaseDate: Date = new Date(),
  minimumLimit = 0
): CardRecommendation | null {
  const activeCards = cards.filter(
    c => c.is_active && c.available_limit >= minimumLimit
  );

  if (activeCards.length === 0) return null;

  const recommendations = activeCards.map(card => {
    const { closingDate, dueDate } = calculateBillingDates(card, purchaseDate);
    const daysUntilPayment = differenceInDays(dueDate, purchaseDate);

    return {
      cardId: card.id,
      cardName: card.name,
      daysUntilPayment,
      closingDate,
      dueDate,
      availableLimit: card.available_limit,
    };
  });

  // Sort by: 1) Most days until payment, 2) Highest available limit (tiebreaker)
  recommendations.sort((a, b) => {
    if (b.daysUntilPayment !== a.daysUntilPayment) {
      return b.daysUntilPayment - a.daysUntilPayment;
    }
    return b.availableLimit - a.availableLimit;
  });

  const best = recommendations[0];
  const daysUntilClosing = differenceInDays(best.closingDate, purchaseDate);

  return {
    ...best,
    reason: daysUntilClosing > 0
      ? `Fecha em ${daysUntilClosing} dias. Até ${best.daysUntilPayment} dias para pagar.`
      : `Fatura já fechou. Vence em ${best.daysUntilPayment} dias.`,
  };
}

// ============================================
// FREE BALANCE CALCULATION
// ============================================

export async function calculateFreeBalance(
  householdId: string,
  targetDate: Date,
  includeProjections = true
): Promise<FreeBalanceResult> {
  const today = startOfMonth(new Date());
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');

  // 1. Current balance from all accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .is('deleted_at', null);

  const currentBalance = (accounts || []).reduce(
    (sum, a) => sum + (a.current_balance ?? 0),
    0
  );

  // 2. Pending expenses (not on credit card)
  const { data: pendingTx } = await supabase
    .from('transactions')
    .select('amount')
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .eq('status', 'pending')
    .is('credit_card_id', null)
    .lte('transaction_date', targetDateStr)
    .is('deleted_at', null);

  const pendingExpenses = (pendingTx || []).reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // 3. Credit card due (pending installments until target date)
  const { data: installments } = await supabase
    .from('installments')
    .select('amount')
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .lte('due_date', targetDateStr);

  const creditCardDue = (installments || []).reduce(
    (sum, i) => sum + i.amount,
    0
  );

  // 4 & 5. Expected income and expenses (if projections enabled)
  let expectedIncome = 0;
  let expectedExpenses = 0;

  if (includeProjections) {
    const { data: expectations } = await supabase
      .from('expected_transactions')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .lte('start_date', targetDateStr)
      .or(`end_date.is.null,end_date.gte.${format(today, 'yyyy-MM-dd')}`);

    for (const exp of expectations || []) {
      const projectedAmount = exp.amount * ((exp.confidence_percent ?? 0) / 100);

      if (exp.type === 'income') {
        expectedIncome += projectedAmount;
      } else if (exp.type === 'expense') {
        expectedExpenses += projectedAmount;
      }
    }
  }

  // 6. Pending reimbursements
  const { data: reimbursements } = await supabase
    .from('transactions')
    .select('amount, reimbursed_amount')
    .eq('household_id', householdId)
    .eq('is_reimbursable', true)
    .in('reimbursement_status', ['pending', 'partial'])
    .is('deleted_at', null);

  const pendingReimbursements = (reimbursements || []).reduce(
    (sum, t) => sum + (t.amount - (t.reimbursed_amount ?? 0)),
    0
  );

  // FINAL FORMULA
  const freeBalance =
    currentBalance -
    pendingExpenses -
    creditCardDue +
    expectedIncome -
    expectedExpenses +
    pendingReimbursements;

  const breakdown: BalanceBreakdownItem[] = [
    { label: 'Saldo em contas', value: currentBalance, type: 'positive' },
    { label: 'Despesas pendentes', value: -pendingExpenses, type: 'negative' },
    { label: 'Faturas de cartão', value: -creditCardDue, type: 'negative' },
  ];

  if (includeProjections) {
    breakdown.push(
      { label: 'Receitas esperadas', value: expectedIncome, type: 'positive' },
      { label: 'Despesas fixas', value: -expectedExpenses, type: 'negative' }
    );
  }

  breakdown.push({
    label: 'Reembolsos a receber',
    value: pendingReimbursements,
    type: 'positive',
  });

  return {
    currentBalance,
    pendingExpenses,
    creditCardDue,
    expectedIncome,
    expectedExpenses,
    pendingReimbursements,
    freeBalance,
    breakdown,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getBalanceColor(value: number): string {
  if (value > 0) return 'text-income';
  if (value < 0) return 'text-expense';
  return 'text-slate-400';
}

export function getBalanceBgColor(value: number): string {
  if (value > 0) return 'bg-green-50 dark:bg-green-900/20';
  if (value < 0) return 'bg-red-50 dark:bg-red-900/20';
  return 'bg-slate-50 dark:bg-slate-800';
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}
