import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAccounts, useCreateAccount } from '../useAccounts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { act } from 'react-dom/test-utils';

// Mocks
const mockGetAccounts = vi.fn();
const mockCreateAccount = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getAccounts: (...args: any[]) => mockGetAccounts(...args),
  createAccount: (...args: any[]) => mockCreateAccount(...args),
  getAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
  getTotalBalance: vi.fn(),
}));

vi.mock('@/stores', () => ({
  useHouseholdId: vi.fn(),
}));

// Setup wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

import { useHouseholdId } from '@/stores';

describe('useAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useHouseholdId as any).mockReturnValue('household-123');
  });

  describe('useAccounts (List)', () => {
    it('should fetch accounts', async () => {
      mockGetAccounts.mockResolvedValue([]);
      
      const { result } = renderHook(() => useAccounts(), { wrapper: createWrapper() });
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(mockGetAccounts).toHaveBeenCalledWith('household-123');
    });
  });

  describe('useCreateAccount', () => {
    it('should create an account and invalidate queries', async () => {
        mockCreateAccount.mockResolvedValue({ id: 'new-acc', name: 'Bank' });
      
        const { result } = renderHook(() => useCreateAccount(), { wrapper: createWrapper() });
      
        await act(async () => {
            await result.current.mutateAsync({
                name: 'Bank',
                type: 'checking',
                initial_balance: 1000,
                color: '#000000',
                icon: 'bank',
            } as any);
        });
      
        expect(mockCreateAccount).toHaveBeenCalledWith(
            expect.objectContaining({
                household_id: 'household-123',
                name: 'Bank',
            })
        );
      
        expect(result.current.isSuccess).toBe(true);
    });
  });
});
