import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useHouseholdId } from '@/stores';

export interface PaymentSummary {
  pending: number;
  paid: number;
  overdue: number;
  partial_balance: number;
}

export function usePaymentSummary() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: ['paymentSummary', householdId],
    queryFn: async (): Promise<PaymentSummary> => {
      if (!householdId) {
        return { pending: 0, paid: 0, overdue: 0, partial_balance: 0 };
      }

      const { data, error } = await supabase
        .rpc('get_payment_summary', { p_household_id: householdId });

      if (error) {
        console.error('Error fetching payment summary:', error);
        // Return fallback if function doesn't exist yet
        return { pending: 0, paid: 0, overdue: 0, partial_balance: 0 };
      }

      return data as PaymentSummary;
    },
    enabled: !!householdId,
    staleTime: 30000, // 30 seconds
  });
}
