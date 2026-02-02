import { 
  differenceInDays, 
  getDaysInMonth, 
  startOfMonth,
  endOfMonth,
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

// ========== HELPER FUNCTIONS FOR FREE BALANCE CALCULATION ==========

async function fetchCurrentBalance(
  householdId: string
): Promise<number> {
  const { data: accounts } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .is('deleted_at', null);

  return addCents(
    ...(accounts ?? []).map(a => toCents(a.current_balance ?? 0))
  );
}

async function fetchPendingExpenses(
  householdId: string,
  targetDateStr: string
): Promise<number> {
  const { data: pendingTx } = await supabase
    .from('transactions')
    .select('amount')
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .eq('status', 'pending')
    .is('credit_card_id', null)
    .lte('transaction_date', targetDateStr)
    .is('deleted_at', null);

  // Expenses are negative in DB, return absolute value (positive)
  return addCents(
    ...(pendingTx ?? []).map(t => Math.abs(toCents(t.amount ?? 0)))
  );
}

async function fetchCreditCardDue(
  householdId: string,
  targetDateStr: string
): Promise<number> {
  const { data: installments } = await supabase
    .from('installments')
    .select('amount')
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .lte('due_date', targetDateStr)
    .is('deleted_at', null);

  return addCents(
    ...(installments ?? []).map(i => toCents(i.amount ?? 0))
  );
}

async function fetchProjectedTransactions(
  householdId: string,
  targetDateStr: string,
  todayStr: string
): Promise<{ incomeCents: number; expensesCents: number }> {
  const { data: expectations } = await supabase
    .from('expected_transactions')
    .select('amount, confidence_percent, type')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .lte('start_date', targetDateStr)
    .or(`end_date.is.null,end_date.gte.${todayStr}`);

  let incomeCents = 0;
  let expensesCents = 0;

  for (const exp of (expectations ?? [])) {
    const amountCents = toCents(exp.amount ?? 0);
    const projectedCents = multiplyCents(
      amountCents,
      (exp.confidence_percent ?? 0) / 100
    );

    if (exp.type === 'income') {
      incomeCents = addCents(incomeCents, projectedCents);
    } else if (exp.type === 'expense') {
      expensesCents = addCents(expensesCents, projectedCents);
    }
  }

  return { incomeCents, expensesCents };
}

async function fetchPendingReimbursements(
  householdId: string
): Promise<number> {
  const { data: reimbursements } = await supabase
    .from('transactions')
    .select('amount, reimbursed_amount')
    .eq('household_id', householdId)
    .eq('is_reimbursable', true)
    .in('reimbursement_status', ['pending', 'partial'])
    .is('deleted_at', null);

  return addCents(
    ...(reimbursements ?? []).map(t => {
      const amountCents = toCents(t.amount ?? 0);
      return subtractCents(amountCents, toCents(t.reimbursed_amount ?? 0));
    })
  );
}

async function fetchPendingTransfers(
  householdId: string,
  targetDateStr: string
): Promise<number> {
  const { data: pendingTransfers } = await supabase
    .from('transactions')
    .select('amount')
    .eq('household_id', householdId)
    .eq('type', 'transfer')
    .eq('status', 'pending')
    .lte('transaction_date', targetDateStr)
    .is('deleted_at', null);

  return addCents(
    ...(pendingTransfers ?? []).map(t => toCents(t.amount ?? 0))
  );
}

function buildBalanceBreakdown(components: {
  currentBalanceCents: number;
  pendingExpensesCents: number;
  creditCardDueCents: number;
  expectedIncomeCents: number;
  expectedExpensesCents: number;
  pendingReimbursementsCents: number;
  pendingTransfersCents: number;
  includeProjections: boolean;
}): BalanceBreakdownItem[] {
  const {
    currentBalanceCents,
    pendingExpensesCents,
    creditCardDueCents,
    expectedIncomeCents,
    expectedExpensesCents,
    pendingReimbursementsCents,
    pendingTransfersCents,
    includeProjections,
  } = components;

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

  if (pendingTransfersCents !== 0) {
    breakdown.push({
      label: 'Transferências programadas',
      value: toReais(pendingTransfersCents),
      type: pendingTransfersCents >= 0 ? 'positive' : 'negative',
    });
  }

  return breakdown;
}

// ========== MAIN FUNCTION (REFACTORED) ==========

export async function calculateFreeBalance(
  householdId: string,
  targetDate: Date,
  includeProjections = true
): Promise<FreeBalanceResult> {
  const today = startOfMonth(new Date());
  const monthEnd = endOfMonth(targetDate);
  const targetDateStr = format(monthEnd, 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  // Fetch all components in parallel for better performance
  const [
    currentBalanceCents,
    pendingExpensesCents,
    creditCardDueCents,
    projectedTransactions,
    pendingReimbursementsCents,
    pendingTransfersCents,
  ] = await Promise.all([
    fetchCurrentBalance(householdId),
    fetchPendingExpenses(householdId, targetDateStr),
    fetchCreditCardDue(householdId, targetDateStr),
    includeProjections
      ? fetchProjectedTransactions(householdId, targetDateStr, todayStr)
      : Promise.resolve({ incomeCents: 0, expensesCents: 0 }),
    fetchPendingReimbursements(householdId),
    fetchPendingTransfers(householdId, targetDateStr),
  ]);

  const { incomeCents: expectedIncomeCents, expensesCents: expectedExpensesCents } =
    projectedTransactions;

  // Calculate final balance (ALL IN CENTS - NO FLOATING POINT!)
  const freeBalanceCents = addCents(
    currentBalanceCents,
    -pendingExpensesCents,
    -creditCardDueCents,
    expectedIncomeCents,
    -expectedExpensesCents,
    pendingReimbursementsCents,
    pendingTransfersCents
  );

  // Build breakdown for UI
  const breakdown = buildBalanceBreakdown({
    currentBalanceCents,
    pendingExpensesCents,
    creditCardDueCents,
    expectedIncomeCents,
    expectedExpensesCents,
    pendingReimbursementsCents,
    pendingTransfersCents,
    includeProjections,
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
