/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@/test/test-utils';
import { useImpersonation } from '@/admin/hooks/useImpersonation';
import { supabase } from '@/lib/supabase';
import { createMockQueryBuilder } from '@/test/mocks/supabase-admin';
import { usePermissions } from '@/admin/hooks/usePermissions';

// Mock usePermissions
vi.mock('@/admin/hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

describe('useImpersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePermissions).mockReturnValue({
      can: vi.fn().mockReturnValue(true),
      loading: false,
      user: null,
      role: undefined,
    });
  });

  const mockSession = {
    id: 'session-1',
    admin_id: 'admin-1',
    user_id: 'user-1',
    started_at: new Date().toISOString(),
    ended_at: null,
    timeout_at: new Date(Date.now() + 3600000).toISOString(),
    reason: 'Support',
  };

  it('deve verificar permissão de impersonation', () => {
    vi.mocked(usePermissions).mockReturnValue({
      can: vi.fn().mockReturnValue(false),
      loading: false,
      user: null,
      role: undefined,
    });

    const { result } = renderHook(() => useImpersonation());
    expect(result.current.canImpersonate).toBe(false);
  });

  it('deve carregar sessão ativa', async () => {
    const queryBuilder = createMockQueryBuilder(mockSession);
    vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);

    const { result } = renderHook(() => useImpersonation());

    await waitFor(() => expect(result.current.isImpersonating).toBe(true));
    expect(result.current.currentSession).toEqual(mockSession);
  });

  it('deve iniciar impersonation com sucesso', async () => {
    // Mock RPC call
    vi.mocked(supabase.rpc).mockResolvedValue({ 
      data: mockSession, 
      error: null 
    } as any);

    const { result } = renderHook(() => useImpersonation());

    await act(async () => {
      await result.current.startImpersonation.mutateAsync({
        userId: 'user-1',
        reason: 'Test reason'
      });
    });

    expect(supabase.rpc).toHaveBeenCalledWith('start_impersonation', expect.objectContaining({
      target_user_id: 'user-1',
      impersonation_reason: 'Test reason'
    }));
  });

  it('deve parar impersonation com sucesso', async () => {
    // Setup active session
    const queryBuilder = createMockQueryBuilder(mockSession);
    vi.mocked(supabase.from).mockReturnValue(queryBuilder as any);
    
    // Mock RPC for stop
    vi.mocked(supabase.rpc).mockResolvedValue({ 
      data: { success: true }, 
      error: null 
    } as any);

    const { result } = renderHook(() => useImpersonation());
    
    await waitFor(() => expect(result.current.currentSession).toBeDefined());

    await act(async () => {
      await result.current.stopImpersonation.mutateAsync();
    });

    expect(supabase.rpc).toHaveBeenCalledWith('stop_impersonation', {
      session_id_param: 'session-1'
    });
  });

  it('deve falhar se usuário não tiver permissão', async () => {
    vi.mocked(usePermissions).mockReturnValue({
      can: vi.fn().mockReturnValue(false),
      loading: false,
      user: null,
      role: undefined,
    });

    const { result } = renderHook(() => useImpersonation());

    await expect(
      result.current.startImpersonation.mutateAsync({ userId: 'user-1' })
    ).rejects.toThrow('Você não tem permissão');
  });
});
