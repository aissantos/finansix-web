import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useCreditCards, useCreateCreditCard, useBestCard } from '../useCreditCards';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { act } from 'react-dom/test-utils';
import type { InsertTables } from '@/types';

// Mocks
const mockGetCreditCards = vi.fn();
const mockCreateCreditCard = vi.fn();
const mockGetBestCard = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getCreditCards: (...args: unknown[]) => mockGetCreditCards(...args),
  createCreditCard: (...args: unknown[]) => mockCreateCreditCard(...args),
  getCreditCard: vi.fn(),
  updateCreditCard: vi.fn(),
  deleteCreditCard: vi.fn(),
  getTotalCreditUsage: vi.fn(),
}));

vi.mock('@/lib/sentry', () => ({
  captureError: vi.fn(),
  setSentryUser: vi.fn(),
  clearSentryUser: vi.fn(),
}));

vi.mock('@/lib/utils/calculations', () => ({
    getBestCard: (...args: unknown[]) => mockGetBestCard(...args),
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

describe('useCreditCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useHouseholdId as unknown as Mock).mockReturnValue('household-123');
    (useSelectedMonth as unknown as Mock).mockReturnValue(new Date('2026-02-01'));
  });

  describe('useCreditCards (List)', () => {
    it('should fetch credit cards', async () => {
      mockGetCreditCards.mockResolvedValue([]);
      
      const { result } = renderHook(() => useCreditCards(), { wrapper: createWrapper() });
      
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      
      expect(mockGetCreditCards).toHaveBeenCalledWith('household-123');
    });
  });

  describe('useBestCard', () => {
    it('should calculate best card', async () => {
        mockGetCreditCards.mockResolvedValue([{ id: 'card-1' }]);
        mockGetBestCard.mockReturnValue({ id: 'card-1' });

        const { result } = renderHook(() => useBestCard(100), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockGetCreditCards).toHaveBeenCalled();
        expect(mockGetBestCard).toHaveBeenCalledWith(
            [{ id: 'card-1' }],
            expect.any(Date),
            100
        );
    });
  });

  describe('useCreateCreditCard', () => {
    it('should create a card and invalidate queries', async () => {
        mockCreateCreditCard.mockResolvedValue({ id: 'new-card', name: 'Visa' });
      
        const { result } = renderHook(() => useCreateCreditCard(), { wrapper: createWrapper() });
      
        await act(async () => {
            await result.current.mutateAsync({
                name: 'Visa',
                limit: 5000,
                closing_day: 10,
                due_day: 15,
                color: '#000',
                icon: 'credit-card',
            } as unknown as Omit<InsertTables<'credit_cards'>, 'household_id'>);
        });
      
        expect(mockCreateCreditCard).toHaveBeenCalledWith(
            expect.objectContaining({
                household_id: 'household-123',
                name: 'Visa',
            })
        );
      
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
