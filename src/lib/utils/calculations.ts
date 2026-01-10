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
// MONETARY UTILITIES (CENTS-BASED)
// ============================================

/**
 * Convert reais to cents (for storage)
 * @param reais - Amount in reais (e.g., 123.45)
 * @returns Amount in cents (e.g., 12345)
 */
export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/**
 * Convert cents to reais (for display)
 * @param cents - Amount in cents (e.g., 12345)
 * @returns Amount in reais (e.g., 123.45)
 */
export function toReais(cents: number): number {
  return cents / 100;
}

/**
 * Add amounts in cents (safe from floating point errors)
 */
export function addCents(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0);
}

/**
 * Subtract amounts in cents
 */
export function subtractCents(a: number, b: number): number {
  return a - b;
}

/**
 * Multiply cents by a factor
 */
export function multiplyCents(cents: number, factor: number): number {
  return Math.round(cents * factor);
}

/**
 * Divide cents amount into equal parts
 */
export function divideCents(cents: number, divisor: number): number {
  return Math.round(cents / divisor);
}

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
// FREE BALANCE CALCULATION (CENTS-BASED)
// ============================================

export async function calculateFreeBalance(
  householdId: string,
  targetDate: Date,
  includeProjections = true
): Promise<FreeBalanceResult> {
  const today = startOfMonth(new Date());
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');

  // 1. Current balance from all accounts (IN CENTS)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('current_balance, current_balance_cents')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .is('deleted_at', null);

  type AccountRow = { current_balance: number; current_balance_cents?: number };
  const currentBalanceCents = addCents(
    ...((accounts || []) as AccountRow[]).map(a => 
      a.current_balance_cents ?? toCents(a.current_balance)
    )
  );

  // 2. Pending expenses (not on credit card) (IN CENTS)
  const { data: pendingTx } = await supabase
    .from('transactions')
    .select('amount, amount_cents')
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .eq('status', 'pending')
    .is('credit_card_id', null)
    .lte('transaction_date', targetDateStr)
    .is('deleted_at', null);

  type TxAmountRow = { amount: number; amount_cents?: number };
  const pendingExpensesCents = addCents(
    ...((pendingTx || []) as TxAmountRow[]).map(t => 
      t.amount_cents ?? toCents(t.amount)
    )
  );

  // 3. Credit card due (pending installments until target date) (IN CENTS)
  const { data: installments } = await supabase
    .from('installments')
    .select('amount, amount_cents')
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .lte('due_date', targetDateStr);

  type InstAmountRow = { amount: number; amount_cents?: number };
  const creditCardDueCents = addCents(
    ...((installments || []) as InstAmountRow[]).map(i => 
      i.amount_cents ?? toCents(i.amount)  // Fallback para amount se amount_cents não existir
    )
  );

  // 4 & 5. Expected income and expenses (if projections enabled) (IN CENTS)
  let expectedIncomeCents = 0;
  let expectedExpensesCents = 0;

  if (includeProjections) {
    const { data: expectations } = await supabase
      .from('expected_transactions')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .lte('start_date', targetDateStr)
      .or(`end_date.is.null,end_date.gte.${format(today, 'yyyy-MM-dd')}`);

    type ExpectedRow = { amount: number; confidence_percent: number; type: string };
    for (const exp of ((expectations || []) as ExpectedRow[])) {
      const amountCents = toCents(exp.amount);
      const projectedCents = multiplyCents(amountCents, (exp.confidence_percent ?? 0) / 100);

      if (exp.type === 'income') {
        expectedIncomeCents = addCents(expectedIncomeCents, projectedCents);
      } else if (exp.type === 'expense') {
        expectedExpensesCents = addCents(expectedExpensesCents, projectedCents);
      }
    }
  }

  // 6. Pending reimbursements (IN CENTS)
  const { data: reimbursements } = await supabase
    .from('transactions')
    .select('amount, amount_cents, reimbursed_amount')
    .eq('household_id', householdId)
    .eq('is_reimbursable', true)
    .in('reimbursement_status', ['pending', 'partial'])
    .is('deleted_at', null);

  type ReimbRow = { amount: number; amount_cents?: number; reimbursed_amount: number | null };
  const pendingReimbursementsCents = addCents(
    ...((reimbursements || []) as ReimbRow[]).map(t => {
      const amountCents = t.amount_cents ?? toCents(t.amount);
      return subtractCents(amountCents, toCents(t.reimbursed_amount ?? 0));
    })
  );

  // FINAL FORMULA (ALL IN CENTS - NO FLOATING POINT!)
  const freeBalanceCents = addCents(
    currentBalanceCents,
    -pendingExpensesCents,
    -creditCardDueCents,
    expectedIncomeCents,
    -expectedExpensesCents,
    pendingReimbursementsCents
  );

  // Convert to reais for display
  const breakdown: BalanceBreakdownItem[] = [
    { label: 'Saldo em contas', value: toReais(currentBalanceCents), type: 'positive' },
    { label: 'Despesas pendentes', value: -toReais(pendingExpensesCents), type: 'negative' },
    { label: 'Faturas de cartão', value: -toReais(creditCardDueCents), type: 'negative' },
  ];

  if (includeProjections) {
    breakdown.push(
      { label: 'Receitas esperadas', value: toReais(expectedIncomeCents), type: 'positive' },
      { label: 'Despesas fixas', value: -toReais(expectedExpensesCents), type: 'negative' }
    );
  }

  breakdown.push({
    label: 'Reembolsos a receber',
    value: toReais(pendingReimbursementsCents),
    type: 'positive',
  });

  return {
    currentBalance: toReais(currentBalanceCents),
    pendingExpenses: toReais(pendingExpensesCents),
    creditCardDue: toReais(creditCardDueCents),
    expectedIncome: toReais(expectedIncomeCents),
    expectedExpenses: toReais(expectedExpensesCents),
    pendingReimbursements: toReais(pendingReimbursementsCents),
    freeBalance: toReais(freeBalanceCents),
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

/**
 * Calculate monthly average from a list of values (IN CENTS)
 */
export function calculateMonthlyAverage(valuesCents: number[]): number {
  if (valuesCents.length === 0) return 0;
  const totalCents = addCents(...valuesCents);
  return toReais(divideCents(totalCents, valuesCents.length));
}

/**
 * Calculate total amount for installments (IN CENTS)
 */
export function calculateInstallmentTotal(
  amountCents: number,
  totalInstallments: number
): number {
  return toReais(multiplyCents(amountCents, totalInstallments));
}
