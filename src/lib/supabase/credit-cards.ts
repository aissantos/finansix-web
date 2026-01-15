import { supabase } from './client';
import { handleSupabaseError, NotFoundError } from '@/lib/utils/errors';
import type { 
  CreditCard, 
  CreditCardWithLimits, 
  InsertTables, 
  UpdateTables 
} from '@/types';

export async function getCreditCards(householdId: string): Promise<CreditCardWithLimits[]> {
  // Use the view that calculates limits on-the-fly
  const { data: limits, error: limitsError } = await supabase
    .from('credit_card_limits')
    .select('*')
    .eq('household_id', householdId);

  if (limitsError) handleSupabaseError(limitsError);

  // Get full card details
  const { data: cards, error: cardsError } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  if (cardsError) handleSupabaseError(cardsError);

  // Merge card details with limits
  type LimitData = { id: string; available_limit: number; used_limit: number };
  const limitsMap = new Map((limits as LimitData[] | null)?.map(l => [l.id, l]) ?? []);
  
  return (cards ?? []).map(card => ({
    ...card,
    available_limit: limitsMap.get(card.id)?.available_limit ?? card.credit_limit,
    used_limit: limitsMap.get(card.id)?.used_limit ?? 0,
  }));
}

export async function getCreditCard(id: string): Promise<CreditCardWithLimits> {
  const { data: card, error: cardError } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (cardError) handleSupabaseError(cardError);
  if (!card) throw new NotFoundError('Cartão de crédito');

  const { data: limit } = await supabase
    .from('credit_card_limits')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const limitData = limit as { available_limit: number; used_limit: number } | null;

  return {
    ...card,
    available_limit: limitData?.available_limit ?? card.credit_limit,
    used_limit: limitData?.used_limit ?? 0,
  };
}

export async function createCreditCard(
  card: InsertTables<'credit_cards'>
): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert(card)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Cartão criado');
  return data;
}

export async function updateCreditCard(
  id: string,
  updates: UpdateTables<'credit_cards'>
): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Cartão');
  return data;
}

export async function deleteCreditCard(id: string): Promise<void> {
  const { error } = await supabase
    .from('credit_cards')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id);

  if (error) handleSupabaseError(error);
}

export async function getTotalCreditUsage(householdId: string): Promise<{
  totalLimit: number;
  totalUsed: number;
  utilizationPercent: number;
}> {
  const { data, error } = await supabase
    .from('credit_card_limits')
    .select('credit_limit, used_limit')
    .eq('household_id', householdId);

  if (error) handleSupabaseError(error);

  type CreditLimitRow = { credit_limit: number; used_limit: number };
  const rows = (data ?? []) as CreditLimitRow[];
  const totalLimit = rows.reduce((sum, c) => sum + c.credit_limit, 0);
  const totalUsed = rows.reduce((sum, c) => sum + c.used_limit, 0);

  return {
    totalLimit,
    totalUsed,
    utilizationPercent: totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0,
  };
}
