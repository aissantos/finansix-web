import { supabase } from './client';
import { handleSupabaseError, NotFoundError } from '@/lib/utils/errors';
import type { 
  Transaction, 
  TransactionWithDetails, 
  InsertTables, 
  UpdateTables 
} from '@/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function getTransactions(
  householdId: string,
  options?: {
    month?: Date;
    limit?: number;
    offset?: number;
    type?: 'income' | 'expense' | 'transfer';
    status?: 'pending' | 'completed' | 'cancelled';
    beforeDate?: string;
    includeInstallments?: boolean; // If true, includes installments billed in the selected month
  }
): Promise<TransactionWithDetails[]> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, icon, color, type),
      credit_card:credit_cards(id, name, last_four_digits, brand, credit_limit),
      account:accounts(id, name, type, current_balance),
      installments:installments(*)
    `)
    .eq('household_id', householdId)
    .is('deleted_at', null)
    .order('transaction_date', { ascending: false });

  if (options?.month) {
    const start = format(startOfMonth(options.month), 'yyyy-MM-dd');
    const end = format(endOfMonth(options.month), 'yyyy-MM-dd');
    query = query.gte('transaction_date', start).lte('transaction_date', end);
  }

  // Filter by max date (e.g. for Recent Feed)
  if (options?.beforeDate) {
    query = query.lte('transaction_date', options.beforeDate);
  }

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) handleSupabaseError(error);
  
  let transactions = (data ?? []) as unknown as TransactionWithDetails[];


  // For month filtering, optionally verify installments billing month
  // This allows "Statement View" (Transactions Page) to show installments in their respective months
  if (options?.month && options?.includeInstallments) {
    const selectedMonthStr = format(startOfMonth(options.month), 'yyyy-MM-01');
    
    transactions = transactions.filter(tx => {
      // Non-installment transactions: already filtered by transaction_date
      if (!tx.is_installment || !tx.installments?.length) {
        return true;
      }
      
      // Installment transactions: check if any installment bills in the selected month
      const matchingInstallment = tx.installments.find(inst => 
        inst.billing_month === selectedMonthStr
      );

      if (matchingInstallment) {
        // Clone transaction and keep ONLY the matching installment
        // This ensures the UI (which picks installments[0]) uses the correct one for this month
        tx.installments = [matchingInstallment];
        return true;
      }
      
      return false;
    });
  }

  return transactions;
}

export async function getTransaction(id: string): Promise<TransactionWithDetails> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*),
      credit_card:credit_cards(*),
      account:accounts(*),
      installments:installments(*)
    `)
    .eq('id', id)
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Transação');
  return data as unknown as TransactionWithDetails;
}

export async function createTransaction(
  transaction: Omit<InsertTables<'transactions'>, 'amount_cents'> & { amount_cents?: number }
): Promise<Transaction> {
  // Build the insert object with proper typing - let DB handle defaults
  // FIX: Calculate cents explicitly to satisfy database trigger
  // Calculate cents explicitly
  const amountCents = transaction.amount_cents ?? Math.round(Number(transaction.amount) * 100);

  const insertData: InsertTables<'transactions'> = {
    household_id: transaction.household_id,
    type: transaction.type,
    status: transaction.status ?? 'completed', // Ensure status is set
    amount: Number(transaction.amount),
    amount_cents: amountCents, // Required for installment trigger
    description: transaction.description,
    transaction_date: transaction.transaction_date ?? new Date().toISOString().split('T')[0],
    is_installment: transaction.is_installment ?? false,
    total_installments: transaction.total_installments ?? 1,
    is_reimbursable: transaction.is_reimbursable ?? false,
    is_recurring: transaction.is_recurring ?? false,
    reimbursed_amount: transaction.reimbursed_amount ?? 0,
    
    // Optional fields - explicitly null if not provided to ensure consistent payload
    category_id: transaction.category_id || null,
    account_id: transaction.account_id || null,
    credit_card_id: transaction.credit_card_id || null,
    currency: transaction.currency || 'BRL',
    notes: transaction.notes || null,
    reimbursement_status: transaction.reimbursement_status || null,
    reimbursement_source: transaction.reimbursement_source || null,
    recurrence_type: transaction.recurrence_type || null,
    recurrence_end_date: transaction.recurrence_end_date || null,
    parent_transaction_id: transaction.parent_transaction_id || null,
    current_installment: transaction.current_installment || null,
  };

  /* 
   * Debug Payload removed after fix.
   * If debugging is needed again, inspect 'insertData' here.
   */
  
  const { data, error } = await supabase
    .from('transactions')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[createTransaction] Supabase error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    handleSupabaseError(error);
  }
  if (!data) throw new NotFoundError('Transação criada');
  return data;
}

export async function updateTransaction(
  id: string,
  updates: UpdateTables<'transactions'>
): Promise<Transaction> {
  // If amount is updated, ensure amount_cents is updated too
  const updatesWithCents = { ...updates };
  if (updates.amount !== undefined && updates.amount_cents === undefined) {
    updatesWithCents.amount_cents = Math.round(updates.amount * 100);
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({ ...updatesWithCents, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Transação');
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function deleteTransactions(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', ids);

  if (error) handleSupabaseError(error);
}

export async function getRecentTransactions(
  householdId: string,
  limit = 10
): Promise<TransactionWithDetails[]> {
  const today = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
  // Filter out future transactions by setting beforeDate to Today
  return getTransactions(householdId, { 
    limit,
    beforeDate: today
  });
}

export async function getTransactionsByCategory(
  householdId: string,
  month: Date
): Promise<{ category_id: string; category_name: string; total: number; color: string }[]> {
  const start = format(startOfMonth(month), 'yyyy-MM-dd');
  const end = format(endOfMonth(month), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      amount,
      category:categories(id, name, color)
    `)
    .eq('household_id', householdId)
    .eq('type', 'expense')
    .eq('status', 'completed')
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .is('deleted_at', null);

  if (error) handleSupabaseError(error);

  // Aggregate by category
  type TxWithCategory = { amount: number; category: { id: string; name: string; color: string } | null };
  const aggregated = ((data ?? []) as unknown as TxWithCategory[]).reduce((acc, tx) => {
    const cat = tx.category;
    const catId = cat?.id || 'uncategorized';
    if (!acc[catId]) {
      acc[catId] = {
        category_id: catId,
        category_name: cat?.name || 'Sem categoria',
        total: 0,
        color: cat?.color || '#94a3b8',
      };
    }
    acc[catId].total += tx.amount;
    return acc;
  }, {} as Record<string, { category_id: string; category_name: string; total: number; color: string }>);

  return Object.values(aggregated).sort((a, b) => b.total - a.total);
}