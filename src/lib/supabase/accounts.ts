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
  const validFields = {
    household_id: account.household_id,
    name: account.name,
    type: account.type,
    currency: account.currency ?? 'BRL',
    initial_balance: account.initial_balance ?? 0,
    current_balance: account.initial_balance ?? 0,
    current_balance_cents: account.current_balance_cents ?? 0,
    color: account.color,
    icon: account.icon,
    is_active: account.is_active ?? true,
    // Bank details
    bank_code: account.bank_code,
    bank_name: account.bank_name,
    branch_number: account.branch_number,
    account_number: account.account_number,
    account_digit: account.account_digit,
    pix_key: account.pix_key,
    pix_key_type: account.pix_key_type,
  };

  const { data, error } = await supabase
    .from('accounts')
    .insert(validFields)
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
