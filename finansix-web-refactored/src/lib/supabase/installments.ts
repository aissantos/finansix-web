import { supabase } from './client';
import { handleSupabaseError, NotFoundError } from '@/lib/utils/errors';
import type { Installment, MonthlyProjection } from '@/types';
import { startOfMonth, addMonths, format } from 'date-fns';

export async function getInstallments(
  householdId: string,
  options?: {
    creditCardId?: string;
    status?: 'pending' | 'paid' | 'overdue';
    billingMonth?: Date;
  }
): Promise<Installment[]> {
  let query = supabase
    .from('installments')
    .select('*')
    .eq('household_id', householdId)
    .order('due_date');

  if (options?.creditCardId) {
    query = query.eq('credit_card_id', options.creditCardId);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.billingMonth) {
    const monthStr = format(startOfMonth(options.billingMonth), 'yyyy-MM-dd');
    query = query.eq('billing_month', monthStr);
  }

  const { data, error } = await query;

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getInstallmentProjection(
  householdId: string,
  months = 12
): Promise<MonthlyProjection[]> {
  const startMonth = startOfMonth(new Date());
  const endMonth = addMonths(startMonth, months);

  const { data, error } = await supabase
    .from('installments')
    .select(`
      amount,
      billing_month,
      credit_card:credit_cards(id, name, color)
    `)
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .gte('billing_month', format(startMonth, 'yyyy-MM-dd'))
    .lt('billing_month', format(endMonth, 'yyyy-MM-dd'));

  if (error) handleSupabaseError(error);

  // Initialize all months
  const projections = new Map<string, MonthlyProjection>();
  for (let i = 0; i < months; i++) {
    const month = addMonths(startMonth, i);
    const key = format(month, 'yyyy-MM');
    projections.set(key, {
      month,
      totalInstallments: 0,
      byCard: [],
    });
  }

  // Aggregate data
  type InstallmentRow = {
    amount: number;
    billing_month: string;
    credit_card: { id: string; name: string; color: string | null } | null;
  };
  
  for (const inst of (data ?? []) as InstallmentRow[]) {
    const key = format(new Date(inst.billing_month), 'yyyy-MM');
    const projection = projections.get(key);

    if (projection) {
      projection.totalInstallments += inst.amount;

      const cardEntry = projection.byCard.find(c => c.cardId === inst.credit_card?.id);
      if (cardEntry) {
        cardEntry.amount += inst.amount;
      } else if (inst.credit_card) {
        projection.byCard.push({
          cardId: inst.credit_card.id,
          cardName: inst.credit_card.name,
          amount: inst.amount,
          color: inst.credit_card.color ?? undefined,
        });
      }
    }
  }

  return Array.from(projections.values());
}

export async function markInstallmentPaid(
  id: string,
  paidAmount?: number
): Promise<Installment> {
  const { data, error } = await supabase
    .from('installments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_amount: paidAmount,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Parcela');
  return data;
}

export async function getPendingInstallmentsTotal(
  householdId: string,
  untilDate?: Date
): Promise<number> {
  let query = supabase
    .from('installments')
    .select('amount')
    .eq('household_id', householdId)
    .eq('status', 'pending');

  if (untilDate) {
    query = query.lte('due_date', format(untilDate, 'yyyy-MM-dd'));
  }

  const { data, error } = await query;

  if (error) handleSupabaseError(error);
  return (data ?? []).reduce((sum, i) => sum + i.amount, 0);
}
