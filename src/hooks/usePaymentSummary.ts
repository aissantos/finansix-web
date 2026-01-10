import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { useHouseholdId, useSelectedMonth } from '@/stores';

export interface PaymentSummary {
  pending: number;
  paid: number;
  overdue: number;
  partial_balance: number;
}

export function usePaymentSummary() {
  const householdId = useHouseholdId();
  const selectedMonth = useSelectedMonth();
  const monthKey = format(selectedMonth, 'yyyy-MM');

  return useQuery({
    queryKey: ['paymentSummary', householdId, monthKey],
    queryFn: async (): Promise<PaymentSummary> => {
      if (!householdId) {
        return { pending: 0, paid: 0, overdue: 0, partial_balance: 0 };
      }

      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      // Get pending bills for selected month
      const { data: pendingTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('household_id', householdId)
        .eq('type', 'expense')
        .is('credit_card_id', null)
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd)
        .or('payment_status.is.null,payment_status.eq.pending')
        .is('deleted_at', null);

      const pending = (pendingTx ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);

      // Get paid bills for selected month
      const { data: paidTx } = await supabase
        .from('transactions')
        .select('paid_amount, amount')
        .eq('household_id', householdId)
        .eq('type', 'expense')
        .is('credit_card_id', null)
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd)
        .in('payment_status', ['paid', 'partial'])
        .is('deleted_at', null);

      const paid = (paidTx ?? []).reduce((sum, t) => sum + (t.paid_amount ?? t.amount ?? 0), 0);

      // Get overdue bills for selected month
      const { data: overdueTx } = await supabase
        .from('transactions')
        .select('amount, paid_amount')
        .eq('household_id', householdId)
        .eq('type', 'expense')
        .is('credit_card_id', null)
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd)
        .eq('payment_status', 'overdue')
        .is('deleted_at', null);

      const overdue = (overdueTx ?? []).reduce((sum, t) => 
        sum + ((t.amount ?? 0) - (t.paid_amount ?? 0)), 0);

      // Get partial payment remaining balance for selected month
      const { data: partialTx } = await supabase
        .from('transactions')
        .select('amount, paid_amount')
        .eq('household_id', householdId)
        .eq('type', 'expense')
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd)
        .eq('payment_status', 'partial')
        .is('deleted_at', null);

      const partial_balance = (partialTx ?? []).reduce((sum, t) => 
        sum + ((t.amount ?? 0) - (t.paid_amount ?? 0)), 0);

      // Add pending installments for selected month
      const billingMonth = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const { data: pendingInst } = await supabase
        .from('installments')
        .select('amount')
        .eq('household_id', householdId)
        .eq('billing_month', billingMonth)
        .eq('status', 'pending')
        .is('deleted_at', null);

      const pendingInstallments = (pendingInst ?? []).reduce((sum, i) => sum + (i.amount ?? 0), 0);

      return {
        pending: pending + pendingInstallments,
        paid,
        overdue,
        partial_balance,
      };
    },
    enabled: !!householdId,
    staleTime: 30000,
  });
}
