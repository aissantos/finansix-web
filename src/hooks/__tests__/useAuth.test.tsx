
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { useAppStore } from '@/stores';
import { createWrapper } from '@/test/test-utils';
import React from 'react';

// Mock mocks
vi.mock('@/lib/supabase', async () => {
  const actual = await vi.importActual('@/lib/supabase');
  return {
    ...actual,
    supabase: {
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
      },
      from: vi.fn(() => ({
          select: vi.fn(() => ({
              eq: vi.fn(() => ({
                  limit: vi.fn(() => ({
                      data: []
                  }))
              }))
          }))
      })),
    },
    getOrCreateHousehold: vi.fn().mockResolvedValue('household-123'),
  };
});

vi.mock('@/stores', () => ({
  useAppStore: vi.fn(),
}));

describe('useAuth Hook', () => {
  const mockSetHouseholdId = vi.fn();
  
  // Create a reusable wrapper component that includes QueryClient and Router
  const Wrapper = createWrapper();
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <Wrapper>
      <AuthProvider>{children}</AuthProvider>
    </Wrapper>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    (useAppStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        if (selector.toString().includes('setHouseholdId')) return mockSetHouseholdId;
        return null;
    });

    (supabase.auth.getSession as unknown as Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    (supabase.auth.onAuthStateChange as unknown as Mock).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it('should initialize with loading state', async () => {
    // Delay resolution of getSession to verify loading state
    (supabase.auth.getSession as unknown as Mock).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return user when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser };

    (supabase.auth.getSession as unknown as Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });

  it('should return error when login fails', async () => {
    const error = new Error('Invalid credentials');
    (supabase.auth.signInWithPassword as unknown as Mock).mockResolvedValue({ error });

    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    // Wait for init
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await expect(result.current.signIn('test@example.com', 'wrong-password')).rejects.toThrow('Invalid credentials');
  });

  it('should handle signOut successfully', async () => {
    (supabase.auth.signOut as unknown as Mock).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
  
  it('should handle session restoration failure safely', async () => {
    (supabase.auth.getSession as unknown as Mock).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useAuth(), { wrapper: TestWrapper });

    await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
