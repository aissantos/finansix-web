import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useInstallments } from '../useInstallments';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mocks
const mockGetInstallments = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getInstallments: (...args: unknown[]) => mockGetInstallments(...args),
  getInstallmentProjection: vi.fn(),
}));

vi.mock('@/stores', () => ({
  useHouseholdId: vi.fn(),
  useSelectedMonth: vi.fn(),
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

import { useHouseholdId, useSelectedMonth } from '@/stores';

describe('useInstallments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useHouseholdId as unknown as Mock).mockReturnValue('household-123');
    (useSelectedMonth as unknown as Mock).mockReturnValue(new Date('2026-02-01'));
  });

  it('should fetch installments with default options', async () => {
    mockGetInstallments.mockResolvedValue([]);
    
    const { result } = renderHook(() => useInstallments(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetInstallments).toHaveBeenCalledWith(
      'household-123',
      expect.objectContaining({
        billingMonth: expect.any(Date), // Should use selected month by default if no card
      })
    );
  });

  it('should fetch installments for specific credit card (ignoring selected month by default)', async () => {
    mockGetInstallments.mockResolvedValue([]);
    
    const { result } = renderHook(() => useInstallments({ creditCardId: 'cc-1' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetInstallments).toHaveBeenCalledWith(
      'household-123',
      expect.objectContaining({
        creditCardId: 'cc-1',
        billingMonth: undefined, // check logic: !creditCardId && !billingMonth -> useSelectedMonth
      })
    );
  });

  it('should explicitly use selected month when useSelectedMonth is true', async () => {
    mockGetInstallments.mockResolvedValue([]);
    
    const { result } = renderHook(() => useInstallments({ creditCardId: 'cc-1', useSelectedMonth: true }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetInstallments).toHaveBeenCalledWith(
      'household-123',
      expect.objectContaining({
        creditCardId: 'cc-1',
        billingMonth: new Date('2026-02-01'),
      })
    );
  });

  it('should not run if householdId is missing', async () => {
    (useHouseholdId as unknown as Mock).mockReturnValue(null);
    
    const { result } = renderHook(() => useInstallments(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(false); // Should be disabled -> pending but fetchStatus idle? 
    // Actually, disabled queries stay in 'pending' status but fetchStatus is 'idle'.
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetInstallments).not.toHaveBeenCalled();
  });
});
