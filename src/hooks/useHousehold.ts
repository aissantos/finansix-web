import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHousehold,
  getHouseholdMembers,
  updateHousehold,
  updateMemberDisplayName,
  updateMemberRole,
  removeMember,
  createHouseholdInvite,
  getPendingInvites,
  cancelInvite,
  acceptInvite,
} from '@/lib/supabase/household';
import { useHouseholdId } from '@/stores';

export function useHousehold() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: ['household', householdId],
    queryFn: () => getHousehold(householdId!),
    enabled: !!householdId,
  });
}

export function useHouseholdMembers() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: ['householdMembers', householdId],
    queryFn: () => getHouseholdMembers(householdId!),
    enabled: !!householdId,
  });
}

export function useUpdateHousehold() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdId();

  return useMutation({
    mutationFn: (name: string) => updateHousehold(householdId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
    },
  });
}

export function useUpdateMemberDisplayName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, displayName }: { memberId: string; displayName: string }) =>
      updateMemberDisplayName(memberId, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdMembers'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'owner' | 'admin' | 'member' }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdMembers'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdMembers'] });
    },
  });
}

export function usePendingInvites() {
  const householdId = useHouseholdId();

  return useQuery({
    queryKey: ['householdInvites', householdId],
    queryFn: () => getPendingInvites(householdId!),
    enabled: !!householdId,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdId();

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role?: 'admin' | 'member' }) =>
      createHouseholdInvite(householdId!, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdInvites'] });
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => cancelInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdInvites'] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => acceptInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household'] });
      queryClient.invalidateQueries({ queryKey: ['householdMembers'] });
    },
  });
}
