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
  
  return (data ?? []) as unknown as TransactionWithDetails[];
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
  transaction: InsertTables<'transactions'>
): Promise<Transaction> {
  // Only include fields that are actually set (not null/undefined)
  const validFields: Record<string, any> = {};
  
  // Required fields
  validFields.household_id = transaction.household_id;
  validFields.type = transaction.type;
  validFields.amount = transaction.amount;
  validFields.description = transaction.description;
  validFields.transaction_date = transaction.transaction_date;
  
  // Optional fields with defaults
  validFields.status = transaction.status ?? 'completed';
  validFields.is_installment = transaction.is_installment ?? false;
  validFields.total_installments = transaction.total_installments ?? 1;
  validFields.is_reimbursable = transaction.is_reimbursable ?? false;
  validFields.is_recurring = transaction.is_recurring ?? false;
  validFields.reimbursed_amount = transaction.reimbursed_amount ?? 0;
  
  // Optional fields - only add if not null/undefined
  const optionalFields = [
    'category_id',
    'account_id',
    'credit_card_id',
    'currency',
    'notes',
    'reimbursement_status',
    'reimbursement_source',
    'recurrence_type',
    'recurrence_end_date',
    'parent_transaction_id',
    'amount_cents', // P0 migration optional column
  ] as const;
  
  for (const field of optionalFields) {
    const value = transaction[field as keyof typeof transaction];
    if (value !== null && value !== undefined) {
      validFields[field] = value;
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(validFields)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Transação criada');
  return data;
}

export async function updateTransaction(
  id: string,
  updates: UpdateTables<'transactions'>
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...updates, updated_at: new Date().toISOString() })
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

export async function getRecentTransactions(
  householdId: string,
  limit = 10
): Promise<TransactionWithDetails[]> {
  return getTransactions(householdId, { limit });
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
