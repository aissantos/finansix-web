import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isBefore } from 'date-fns';
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
      const today = new Date();

      // Get pending expenses for selected month (status = pending)
      const { data: pendingTx } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('household_id', householdId)
        .eq('type', 'expense')
        .eq('status', 'pending')
        .is('credit_card_id', null)
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd)
        .is('deleted_at', null);

      // Separate pending into on-time and overdue
      let pending = 0;
      let overdue = 0;
      
      for (const tx of pendingTx ?? []) {
        const txDate = new Date(tx.transaction_date);
        if (isBefore(txDate, today)) {
          overdue += tx.amount ?? 0;
        } else {
          pending += tx.amount ?? 0;
        }
      }

      // Get completed (paid) expenses for selected month
      const { data: paidTx } = await supabase
        .from('transactions')
        .select('amount')
        .eq('household_id', householdId)
        .eq('type', 'expense')
        .eq('status', 'completed')
        .is('credit_card_id', null)
        .gte('transaction_date', monthStart)
        .lte('transaction_date', monthEnd)
        .is('deleted_at', null);

      const paid = (paidTx ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);

      // Get pending installments for selected month
      const { data: pendingInst } = await supabase
        .from('installments')
        .select('amount, due_date')
        .eq('household_id', householdId)
        .eq('status', 'pending')
        .gte('due_date', monthStart)
        .lte('due_date', monthEnd)
        .is('deleted_at', null);

      // Separate installments into pending and overdue
      for (const inst of pendingInst ?? []) {
        const dueDate = new Date(inst.due_date);
        if (isBefore(dueDate, today)) {
          overdue += inst.amount ?? 0;
        } else {
          pending += inst.amount ?? 0;
        }
      }

      // Get paid installments for selected month
      const { data: paidInst } = await supabase
        .from('installments')
        .select('amount')
        .eq('household_id', householdId)
        .eq('status', 'paid')
        .gte('due_date', monthStart)
        .lte('due_date', monthEnd)
        .is('deleted_at', null);

      const paidInstallments = (paidInst ?? []).reduce((sum, i) => sum + (i.amount ?? 0), 0);

      return {
        pending,
        paid: paid + paidInstallments,
        overdue,
        partial_balance: 0, // Will be implemented when payment_status is added
      };
    },
    enabled: !!householdId,
    staleTime: 30000,
  });
}
