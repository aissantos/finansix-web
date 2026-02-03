import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFreeBalance } from '@/hooks/useFreeBalance';
import { createWrapper } from '@/test/test-utils';
import * as calculationsModule from '@/lib/utils/calculations';

// Controllable mock values
let mockHouseholdId: string | null = 'test-household-id';

vi.mock('@/lib/utils/calculations');
vi.mock('@/stores/app-store', () => ({
  useHouseholdId: () => mockHouseholdId,
  useSelectedMonth: () => new Date('2026-02-01'),
}));

describe('useFreeBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHouseholdId = 'test-household-id'; // Reset to default
  });

  it('should return free balance data on success', async () => {
    const mockResult = {
      currentBalance: 1000,
      pendingExpenses: 200,
      creditCardDue: 300,
      expectedIncome: 500,
      expectedExpenses: 100,
      pendingReimbursements: 50,
      freeBalance: 950,
      breakdown: [],
    };

    vi.spyOn(calculationsModule, 'calculateFreeBalance').mockResolvedValue(mockResult);

    const { result } = renderHook(() => useFreeBalance(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockResult);
    expect(result.current.data?.freeBalance).toBe(950);
  });

  it('should be disabled when householdId is not available', () => {
    // Set householdId to null to disable the query
    mockHouseholdId = null;

    const { result } = renderHook(() => useFreeBalance(), {
      wrapper: createWrapper(),
    });

    // Query should be disabled, so isLoading should be false immediately
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    vi.spyOn(calculationsModule, 'calculateFreeBalance').mockRejectedValue(
      new Error('Database error')
    );

    const { result } = renderHook(() => useFreeBalance(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });

  it('should support custom target date via options', async () => {
    const mockResult = {
      currentBalance: 1000,
      pendingExpenses: 0,
      creditCardDue: 0,
      expectedIncome: 0,
      expectedExpenses: 0,
      pendingReimbursements: 0,
      freeBalance: 1000,
      breakdown: [],
    };

    const mockCalculate = vi.spyOn(calculationsModule, 'calculateFreeBalance')
      .mockResolvedValue(mockResult);

    const targetDate = new Date('2026-03-01');

    renderHook(() => useFreeBalance({ targetDate }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(mockCalculate).toHaveBeenCalledWith(
      'test-household-id',
      targetDate,
      true
    ));
  });

  it('should respect includeProjections option', async () => {
    const mockResult = {
      currentBalance: 1000,
      pendingExpenses: 0,
      creditCardDue: 0,
      expectedIncome: 0,
      expectedExpenses: 0,
      pendingReimbursements: 0,
      freeBalance: 1000,
      breakdown: [],
    };

    const mockCalculate = vi.spyOn(calculationsModule, 'calculateFreeBalance')
      .mockResolvedValue(mockResult);

    renderHook(() => useFreeBalance({ includeProjections: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(mockCalculate).toHaveBeenCalledWith(
      'test-household-id',
      expect.any(Date),
      false
    ));
  });
});
