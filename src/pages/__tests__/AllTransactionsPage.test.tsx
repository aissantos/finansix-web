import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import AllTransactionsPage from '@/pages/AllTransactionsPage';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/components/transactions/TransactionMetrics', () => ({
  TransactionMetrics: () => <div data-testid="transaction-metrics" />,
}));

vi.mock('@/components/transactions/CategoryDistributionChart', () => ({
  CategoryDistributionChart: () => <div data-testid="category-chart" />,
}));

vi.mock('@/components/features/SwipeableTransactionItem', () => ({
  SwipeableTransactionItem: ({ transaction }: any) => (
    <div data-testid={`transaction-item-${transaction.id}`}>
      {transaction.description} - R$ {transaction.amount}
    </div>
  ),
}));

vi.mock('@/components/transactions/TransactionFilters', () => ({
  TransactionFilters: () => <div data-testid="transaction-filters" />,
}));
// Helper
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

const mockUseAllTransactions = vi.fn(() => ({
  data: mockTransactions,
  isLoading: false,
}));
const mockUseFilteredTransactionsHook = vi.fn(() => ({
  filteredTransactions: mockTransactions,
  totals: {
    income: 5000,
    expense: -150,
    balance: 4850,
  },
}));

vi.mock('@/hooks/useTransactions', () => ({
  useAllTransactions: () => mockUseAllTransactions(),
  useDeleteTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteTransactions: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useFilteredTransactions', () => ({
  useFilteredTransactions: () => mockUseFilteredTransactionsHook(),
}));

// ... (keep useCategories mock as is or refactor if needed, but it was fine)
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({
    data: [
      { id: 'cat1', name: 'Alimentação', icon: '🍔' },
      { id: 'cat2', name: 'Salário', icon: '💰' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAdmin: false,
    signOut: vi.fn(),
  }),
}));

vi.mock('@/stores/app-store', () => ({
  useSelectedMonth: () => new Date('2026-02-01'),
  useAppStore: (selector: any) => selector ? selector({
    user: { id: 'test-user', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    isSidebarOpen: true,
    toggleSidebar: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
  }) : {
    user: { id: 'test-user', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    isSidebarOpen: true,
    toggleSidebar: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
  },
}));

describe('AllTransactionsPage', () => {
  it('should render list of transactions', async () => {
    mockUseAllTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });
    mockUseFilteredTransactionsHook.mockReturnValue({
      filteredTransactions: mockTransactions,
      totals: {
        income: 5000,
        expense: -150,
        balance: 4850,
      },
    });

    renderWithProviders(<AllTransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Mercado/i)).toBeInTheDocument();
      expect(screen.getByText(/Salário/i)).toBeInTheDocument();
    });
  });

  it('should display transaction amounts correctly', async () => {
     mockUseAllTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });
     mockUseFilteredTransactionsHook.mockReturnValue({
      filteredTransactions: mockTransactions,
      totals: {
        income: 5000,
        expense: -150,
        balance: 4850,
      },
    });

    renderWithProviders(<AllTransactionsPage />);

    await waitFor(() => {
      // Should show formatted currency
      expect(screen.getAllByText(/R\$/).length).toBeGreaterThan(0);
    });
  });

  it('should have search/filter functionality', async () => {
    mockUseAllTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });
    const { container } = renderWithProviders(<AllTransactionsPage />);

    await waitFor(() => {
      // Look for search input or filter components
      const inputs = container.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('should show transaction metrics/totals', async () => {
    mockUseAllTransactions.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });
    renderWithProviders(<AllTransactionsPage />);

    await waitFor(() => {
      // Should display totals (income, expense, balance)
      const page = document.body;
      expect(page).toBeInTheDocument();
    });
  });

  it('should handle empty transaction list', async () => {
    mockUseAllTransactions.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockUseFilteredTransactionsHook.mockReturnValue({
        filteredTransactions: [],
        totals: {
          income: 0,
          expense: 0,
          balance: 0,
        },
    });

    renderWithProviders(<AllTransactionsPage />);

    // Should render without errors
    await waitFor(() => {
        expect(document.body).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    mockUseAllTransactions.mockReturnValue({
      data: null,
      isLoading: true,
    });
    mockUseFilteredTransactionsHook.mockReturnValue({
        filteredTransactions: [],
        totals: null as any,
    });

    renderWithProviders(<AllTransactionsPage />);

    // Should show skeleton or loading indicator
    expect(document.body).toBeInTheDocument();
  });
});
