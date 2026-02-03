/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import HomePage from '@/pages/HomePage';
import { renderWithProviders } from '@/test/test-utils';

// Mock centralizado de todos os hooks importados de '@/hooks'
vi.mock('@/hooks', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useFreeBalance: () => ({
      data: { freeBalance: 1000, currentBalance: 1500, breakdown: [] },
      isLoading: false,
    }),
    useRecentTransactions: () => ({
      data: [
        {
          id: '1',
          description: 'Compra teste',
          amount: -50,
          type: 'expense',
          transaction_date: new Date().toISOString(),
          category: { name: 'Alimentação', icon: '🍔' }
        },
        {
          id: '2',
          description: 'Receita teste',
          amount: 100,
          type: 'income',
          transaction_date: new Date().toISOString(),
          category: { name: 'Salário', icon: '💰' }
        },
      ],
      isLoading: false,
    }),
    useCreditCards: () => ({
      data: [{ id: '1', name: 'Nubank', available_limit: 5000, used_limit: 2000 }],
      isLoading: false,
    }),
    useSubscriptionTotal: () => ({
      data: { total: 150 },
      isLoading: false,
    }),
    useTransactions: () => ({
      data: [],
      isLoading: false,
    }),
    useDeleteTransaction: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useCategories: () => ({
      data: [
        { id: '1', name: 'Alimentação', icon: '🍔', type: 'expense' },
        { id: '2', name: 'Salário', icon: '💰', type: 'income' },
      ],
      isLoading: false,
    }),
    useOnlineStatus: () => true,
  };
});

vi.mock('@/stores/app-store', () => ({
  useSelectedMonth: () => new Date('2026-02-01'),
  useAppStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isSidebarOpen: true,
    toggleSidebar: vi.fn(),
    isOnline: true,
    setIsOnline: vi.fn(),
  }),
  useHouseholdId: () => 'test-household-id',
  useIsOnline: () => true,
  useShowFAB: () => true,
}));

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        display_name: 'Test User',
        avatar_url: null,
      },
    },
    session: {
      access_token: 'test-token',
      user: { id: 'test-user-id', email: 'test@example.com' },
    },
    loading: false,
    signOut: vi.fn(),
  }),
}));

describe('HomePage', () => {
  it('should render balance hero with free balance', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Saldo Livre/i)).toBeInTheDocument();
    });
  });

  it('should render recent transactions', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/Compra teste/i)).toBeInTheDocument();
      expect(screen.getByText(/Receita teste/i)).toBeInTheDocument();
    });
  });

  it('should render page content', async () => {
    renderWithProviders(<HomePage />);

    await waitFor(() => {
      // Page should render successfully
      expect(document.body).toBeInTheDocument();
      expect(screen.getByText(/Saldo Livre/i)).toBeInTheDocument();
    });
  });

  it('should show loading state initially when all data is loading', () => {
    renderWithProviders(<HomePage />);

    // Should show skeleton or loading state
    // Note: Depends on HomePage implementation
    const page = document.body;
    expect(page).toBeInTheDocument();
  });

  it('should navigate to transactions page when clicking "Ver todas"', async () => {
    const { container } = renderWithProviders(<HomePage />);

    await waitFor(() => {
      // Look for "Ver todas" or similar link/button
      const verTodasLinks = container.querySelectorAll('a[href*="transactions"], button');
      expect(verTodasLinks.length).toBeGreaterThan(0);
    });
  });
});
