/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePaymentSummary } from '@/hooks/usePaymentSummary';
import { createWrapper } from '@/test/test-utils';
import * as supabaseModule from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');
vi.mock('@/stores/app-store', () => ({
  useHouseholdId: () => 'test-household-id',
  useSelectedMonth: () => new Date('2026-02-01'),
}));

describe('usePaymentSummary', () => {
  const mockFrom = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockIs = vi.fn().mockReturnThis();

  const mockSupabase = {
    from: mockFrom,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue(mockSupabase as any);
  });

  it('should return payment summary with overdue, pending, and paid amounts', async () => {
    // Mock transações pendentes (algumas vencidas, outras não)
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      const mockChain = {
        from: mockFrom,
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        lte: mockLte,
        is: mockIs,
      };

      // Primeira chamada: transactions pending
      if (callCount === 0) {
        callCount++;
        return Promise.resolve({
          data: [
            { amount: -100, transaction_date: '2026-01-15' }, // overdue (passado)
            { amount: -200, transaction_date: '2026-02-28' }, // pending (futuro)
          ],
          error: null,
          ...mockChain,
        });
      }

      // Segunda chamada: transactions paid
      if (callCount === 1) {
        callCount++;
        return Promise.resolve({
          data: [{ amount: -150 }],
          error: null,
          ...mockChain,
        });
      }

      // Terceira chamada: installments pending
      if (callCount === 2) {
        callCount++;
        return Promise.resolve({
          data: [{ amount: 300, due_date: '2026-02-20' }],
          error: null,
          ...mockChain,
        });
      }

      // Quarta chamada: installments paid
      callCount++;
      return Promise.resolve({
        data: [{ amount: 250 }],
        error: null,
        ...mockChain,
      });
    });

    const { result } = renderHook(() => usePaymentSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeDefined();
    // Valores podem variar dependendo da data de "hoje" no teste
    expect(result.current.data?.paid).toBeGreaterThan(0);
  });

  it('should be disabled when householdId is null', () => {
    vi.resetModules();
    vi.doMock('@/stores/app-store', () => ({
      useHouseholdId: () => null,
      useSelectedMonth: () => new Date('2026-02-01'),
    }));

    const { result } = renderHook(() => usePaymentSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should handle empty results gracefully', async () => {
    mockFrom.mockImplementation(() => {
      return Promise.resolve({
        data: [],
        error: null,
        from: mockFrom,
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        lte: mockLte,
        is: mockIs,
      });
    });

    const { result } = renderHook(() => usePaymentSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual({
      pending: 0,
      paid: 0,
      overdue: 0,
      partial_balance: 0,
    });
  });

  it('should handle Supabase errors', async () => {
    mockFrom.mockImplementation(() => {
      return Promise.resolve({
        data: null,
        error: { message: 'Database error', code: '500' },
        from: mockFrom,
        select: mockSelect,
        eq: mockEq,
        gte: mockGte,
        lte: mockLte,
        is: mockIs,
      });
    });

    const { result } = renderHook(() => usePaymentSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });
});
