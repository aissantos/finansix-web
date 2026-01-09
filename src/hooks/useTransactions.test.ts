import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTransactions, useCreateTransaction, useDeleteTransaction } from './useTransactions';
import * as supabaseQueries from '@/lib/supabase/transactions';
import type { TransactionWithDetails } from '@/types';

// Mock Supabase queries
vi.mock('@/lib/supabase/transactions');

// Mock stores
vi.mock('@/stores', () => ({
  useHouseholdId: () => 'household-123',
  useSelectedMonth: () => new Date(2024, 0, 1), // January 2024
}));

// Mock data
const mockTransactions: TransactionWithDetails[] = [
  {
    id: 'tx-1',
    household_id: 'household-123',
    type: 'expense',
    amount: 100,
    description: 'Groceries',
    transaction_date: '2024-01-15',
    status: 'completed',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    deleted_at: null,
    category_id: 'cat-1',
    account_id: 'acc-1',
    credit_card_id: null,
    notes: null,
    category: {
      id: 'cat-1',
      name: 'Food',
      type: 'expense',
      color: '#FF0000',
      icon: 'utensils',
      household_id: 'household-123',
      parent_id: null,
      is_favorite: false,
      default_amount: null,
      sort_order: 0,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    account: null,
    credit_card: null,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch transactions for household and month', async () => {
    vi.mocked(supabaseQueries.getTransactions).mockResolvedValue(mockTransactions);

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual(mockTransactions);
    expect(supabaseQueries.getTransactions).toHaveBeenCalledWith(
      'household-123',
      expect.objectContaining({
        month: expect.any(Date),
      })
    );
  });

  it('should not fetch when householdId is null', () => {
    vi.mocked(supabaseQueries.getTransactions).mockResolvedValue([]);
    
    // Mock null householdId
    vi.mocked(vi.importActual('@/stores') as any).useHouseholdId = () => null;

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(supabaseQueries.getTransactions).not.toHaveBeenCalled();
  });

  it('should filter by transaction type when specified', async () => {
    vi.mocked(supabaseQueries.getTransactions).mockResolvedValue(mockTransactions);

    const { result } = renderHook(
      () => useTransactions({ type: 'expense' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(supabaseQueries.getTransactions).toHaveBeenCalledWith(
      'household-123',
      expect.objectContaining({
        type: 'expense',
      })
    );
  });

  it('should apply limit when specified', async () => {
    vi.mocked(supabaseQueries.getTransactions).mockResolvedValue(mockTransactions);

    const { result } = renderHook(
      () => useTransactions({ limit: 5 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(supabaseQueries.getTransactions).toHaveBeenCalledWith(
      'household-123',
      expect.objectContaining({
        limit: 5,
      })
    );
  });
});

describe('useCreateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create transaction successfully', async () => {
    const newTransaction = {
      type: 'expense' as const,
      amount: 50,
      description: 'Coffee',
      transaction_date: '2024-01-20',
      status: 'completed' as const,
      category_id: 'cat-1',
      account_id: 'acc-1',
    };

    const createdTransaction = {
      ...newTransaction,
      id: 'tx-new',
      household_id: 'household-123',
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      deleted_at: null,
    };

    vi.mocked(supabaseQueries.createTransaction).mockResolvedValue(createdTransaction);

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newTransaction);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(supabaseQueries.createTransaction).toHaveBeenCalledWith({
      ...newTransaction,
      household_id: 'household-123',
    });
    expect(result.current.data).toEqual(createdTransaction);
  });

  it('should handle optimistic updates', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Pre-populate cache with existing transactions
    queryClient.setQueryData(
      ['transactions', 'list', 'household-123', '2024-01'],
      mockTransactions
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const newTransaction = {
      type: 'expense' as const,
      amount: 50,
      description: 'Coffee',
      transaction_date: '2024-01-20',
      status: 'completed' as const,
      category_id: 'cat-1',
      account_id: 'acc-1',
    };

    vi.mocked(supabaseQueries.createTransaction).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ...newTransaction,
        id: 'tx-new',
        household_id: 'household-123',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        deleted_at: null,
      }), 100))
    );

    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    result.current.mutate(newTransaction);

    // Check optimistic update was applied
    const cachedData = queryClient.getQueryData<TransactionWithDetails[]>(
      ['transactions', 'list', 'household-123', '2024-01']
    );
    
    await waitFor(() => {
      expect(cachedData).toHaveLength(2); // Original + optimistic
    });
  });
});

describe('useDeleteTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete transaction successfully', async () => {
    vi.mocked(supabaseQueries.deleteTransaction).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('tx-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(supabaseQueries.deleteTransaction).toHaveBeenCalledWith('tx-1');
  });

  it('should handle deletion errors', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(supabaseQueries.deleteTransaction).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteTransaction(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('tx-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    
    expect(result.current.error).toEqual(error);
  });
});
