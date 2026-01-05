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
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      ...account,
      current_balance: account.initial_balance ?? 0,
    })
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
  return (data ?? []).reduce((sum, a) => sum + a.current_balance, 0);
}
