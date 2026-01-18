import { supabase } from './client';
import { handleSupabaseError, NotFoundError } from '@/lib/utils/errors';
import type { Account, InsertTables, UpdateTables } from '@/types';

export async function getAccounts(householdId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  if (error) handleSupabaseError(error);
  return data ?? [];
}

export async function getAccount(id: string): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Conta');
  return data;
}

export async function createAccount(account: InsertTables<'accounts'>): Promise<Account> {
  // Filter only valid database columns
  const validFields: Record<string, unknown> = {
    household_id: account.household_id,
    name: account.name,
    type: account.type,
    currency: account.currency ?? 'BRL',
    initial_balance: account.initial_balance ?? 0,
    current_balance: account.initial_balance ?? 0,
    color: account.color,
    icon: account.icon,
    is_active: account.is_active ?? true,
  };

  // Add bank details only if provided and not empty
  if (account.bank_code && account.bank_code.trim()) validFields.bank_code = account.bank_code;
  if (account.bank_name && account.bank_name.trim()) validFields.bank_name = account.bank_name;
  if (account.branch_number && account.branch_number.trim()) validFields.branch_number = account.branch_number;
  if (account.account_number && account.account_number.trim()) validFields.account_number = account.account_number;
  if (account.account_digit && account.account_digit.trim()) validFields.account_digit = account.account_digit;
  if (account.pix_key && account.pix_key.trim()) validFields.pix_key = account.pix_key;
  if (account.pix_key_type) validFields.pix_key_type = account.pix_key_type;

  // Add cents column if it exists (from P0 migration)
  if (account.current_balance_cents !== undefined) {
    validFields.current_balance_cents = account.current_balance_cents;
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert(validFields as unknown as InsertTables<'accounts'>)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Conta criada');
  return data;
}

export async function updateAccount(
  id: string,
  updates: UpdateTables<'accounts'>
): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Conta');
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function getTotalBalance(householdId: string): Promise<number> {
  const { data, error } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error) handleSupabaseError(error);
  return (data ?? []).reduce((sum, a) => sum + (a.current_balance ?? 0), 0);
}
