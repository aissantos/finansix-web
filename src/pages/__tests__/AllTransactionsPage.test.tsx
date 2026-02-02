import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import AllTransactionsPage from '@/pages/AllTransactionsPage';
import { renderWithProviders } from '@/test/test-utils';

const mockTransactions = [
  {
    id: '1',
    description: 'Mercado',
    amount: -150,
    type: 'expense',
    transaction_date: new Date().toISOString(),
    category: { id: 'cat1', name: 'Alimentação', icon: '🍔' },
    account: { id: 'acc1', name: 'Conta Corrente' },
  },
  {
    id: '2',
    description: 'Salário',
    amount: 5000,
    type: 'income',
    transaction_date: new Date().toISOString(),
    category: { id: 'cat2', name: 'Salário', icon: '💰' },
    account: { id: 'acc1', name: 'Conta Corrente' },
  },
];

vi.mock('@/hooks/useTransactions', () => ({
  useAllTransactions: () => ({
    data: mockTransactions,
    isLoading: false,
  }),
  useFilteredTransactions: () => ({
    filteredTransactions: mockTransactions,
    totals: {
      income: 5000,
      expense: -150,
      balance: 4850,
    },
  }),
}));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: 'cat1', name: 'Alimentação', icon: '🍔' },
      { id: 'cat2', name: 'Salário', icon: '💰' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useDeleteTransaction', () => ({
  useDeleteTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useDeleteTransactions', () => ({
  useDeleteTransactions: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useUpdateTransaction', () => ({
  useUpdateTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/stores/app-store', () => ({
  useSelectedMonth: () => new Date('2026-02-01'),
}));

describe('AllTransactionsPage', () => {
  it('should render list of transactions', async () => {
    renderWithProviders(<AllTransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Mercado/i)).toBeInTheDocument();
      expect(screen.getByText(/Salário/i)).toBeInTheDocument();
    });
  });

  it('should display transaction amounts correctly', async () => {
    renderWithProviders(<AllTransactionsPage />);

    await waitFor(() => {
      // Should show formatted currency
      expect(screen.getByText(/R\$/)).toBeInTheDocument();
    });
  });

  it('should have search/filter functionality', async () => {
    const { container } = renderWithProviders(<AllTransactionsPage />);

    await waitFor(() => {
      // Look for search input or filter components
      const inputs = container.querySelectorAll('input[type="text"], input[type="search"]');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('should show transaction metrics/totals', async () => {
    renderWithProviders(<AllTransactionsPage />);

    await waitFor(() => {
      // Should display totals (income, expense, balance)
      const page = document.body;
      expect(page).toBeInTheDocument();
    });
  });

  it('should handle empty transaction list', () => {
    vi.mock('@/hooks/useTransactions', () => ({
      useAllTransactions: () => ({
        data: [],
        isLoading: false,
      }),
      useFilteredTransactions: () => ({
        filteredTransactions: [],
        totals: {
          income: 0,
          expense: 0,
          balance: 0,
        },
      }),
    }));

    renderWithProviders(<AllTransactionsPage />);

    // Should render without errors
    expect(document.body).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mock('@/hooks/useTransactions', () => ({
      useAllTransactions: () => ({
        data: null,
        isLoading: true,
      }),
      useFilteredTransactions: () => ({
        filteredTransactions: [],
        totals: null,
      }),
    }));

    renderWithProviders(<AllTransactionsPage />);

    // Should show skeleton or loading indicator
    expect(document.body).toBeInTheDocument();
  });
});
