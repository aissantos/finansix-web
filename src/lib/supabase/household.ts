import { supabase } from './client';
import { handleSupabaseError, NotFoundError } from '@/lib/utils/errors';

export interface HouseholdMember {
  id: string;
  user_id: string;
  household_id: string;
  display_name: string | null;
  role: string | null;
  created_at: string | null;
  email?: string; // Vem do join com auth.users
}

export interface Household {
  id: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface HouseholdInvite {
  id: string;
  household_id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invited_by: string;
  created_at: string;
  expires_at: string;
}

/**
 * Busca os membros do household atual
 */
export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) handleSupabaseError(error);
  return data ?? [];
}

/**
 * Busca informações do household
 */
export async function getHousehold(householdId: string): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', householdId)
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Household');
  return data;
}

/**
 * Atualiza o nome do household
 */
export async function updateHousehold(householdId: string, name: string): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', householdId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Household');
  return data;
}

/**
 * Atualiza o display_name de um membro
 */
export async function updateMemberDisplayName(
  memberId: string, 
  displayName: string
): Promise<HouseholdMember> {
  const { data, error } = await supabase
    .from('household_members')
    .update({ display_name: displayName })
    .eq('id', memberId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Member');
  return data;
}

/**
 * Atualiza o role de um membro (apenas owners podem fazer isso)
 */
export async function updateMemberRole(
  memberId: string, 
  role: 'owner' | 'admin' | 'member'
): Promise<HouseholdMember> {
  const { data, error } = await supabase
    .from('household_members')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();

  if (error) handleSupabaseError(error);
  if (!data) throw new NotFoundError('Member');
  return data;
}

/**
 * Remove um membro do household
 */
export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('id', memberId);

  if (error) handleSupabaseError(error);
}

/**
 * Cria um convite para o household
 * Nota: Requer tabela 'household_invites' no banco
 */
export async function createHouseholdInvite(
  householdId: string,
  email: string,
  role: 'admin' | 'member' = 'member'
): Promise<HouseholdInvite> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verificar se email já é membro
  const { data: existingMember } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', email) // Isso não funciona diretamente, precisaria de RPC
    .single();

  if (existingMember) {
    throw new Error('Este email já é membro do household');
  }

  // Criar convite (expira em 7 dias)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from('household_invites')
    .insert({
      household_id: householdId,
      email: email.toLowerCase(),
      role,
      invited_by: user.id,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Se a tabela não existe, retornar erro amigável
    if (error.code === '42P01') {
      throw new Error('Sistema de convites não configurado. Execute a migration de invites.');
    }
    handleSupabaseError(error);
  }
  
  if (!data) throw new Error('Falha ao criar convite');
  return data as HouseholdInvite;
}

/**
 * Lista convites pendentes do household
 */
export async function getPendingInvites(householdId: string): Promise<HouseholdInvite[]> {
  const { data, error } = await supabase
    .from('household_invites')
    .select('*')
    .eq('household_id', householdId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    // Se a tabela não existe, retornar array vazio
    if (error.code === '42P01') {
      return [];
    }
    handleSupabaseError(error);
  }
  
  return (data ?? []) as HouseholdInvite[];
}

/**
 * Cancela um convite pendente
 */
export async function cancelInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('household_invites')
    .update({ status: 'expired' })
    .eq('id', inviteId);

  if (error) handleSupabaseError(error);
}

/**
 * Aceita um convite (chamado pelo usuário convidado)
 */
export async function acceptInvite(inviteId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Buscar o convite
  const { data: invite, error: inviteError } = await supabase
    .from('household_invites')
    .select('*')
    .eq('id', inviteId)
    .eq('status', 'pending')
    .single();

  if (inviteError || !invite) {
    throw new Error('Convite não encontrado ou expirado');
  }

  // Verificar se o email do usuário corresponde ao convite
  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    throw new Error('Este convite foi enviado para outro email');
  }

  // Verificar se já é membro
  const { data: existingMember } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', invite.household_id)
    .eq('user_id', user.id)
    .single();

  if (existingMember) {
    // Apenas atualizar status do convite
    await supabase
      .from('household_invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId);
    return;
  }

  // Adicionar como membro
  const { error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: invite.household_id,
      user_id: user.id,
      role: invite.role,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
    });

  if (memberError) handleSupabaseError(memberError);

  // Atualizar status do convite
  await supabase
    .from('household_invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId);
}
