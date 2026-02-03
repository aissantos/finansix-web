/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletPage from '@/pages/WalletPage';
import { renderWithProviders } from '@/test/test-utils';

// Mock centralizado de todos os hooks importados de '@/hooks'
vi.mock('@/hooks', () => ({
  useCreditCards: () => ({
    data: [
      {
        id: '1',
        name: 'Nubank',
        available_limit: 5000,
        used_limit: 2000,
        limit: 5000,
        brand: 'Mastercard',
      },
    ],
    isLoading: false,
  }),
  useCreditCard: () => ({
    data: {
      id: '1',
      name: 'Nubank',
      available_limit: 5000,
      used_limit: 2000,
      limit: 5000,
      brand: 'Mastercard',
    },
    isLoading: false,
  }),
  useCreditUsage: () => ({
    data: { used: 2000, limit: 5000, percentage: 40 },
    isLoading: false,
  }),
  useBestCard: () => ({
    data: null,
    isLoading: false,
  }),
  useCreateCreditCard: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateCreditCard: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteCreditCard: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useAccounts: () => ({
    data: [
      {
        id: '1',
        name: 'Conta Corrente',
        current_balance: 1000,
        type: 'checking',
        is_active: true,
      },
    ],
    isLoading: false,
  }),
  useAccount: () => ({
    data: null,
    isLoading: false,
  }),
  useTotalBalance: () => ({
    data: { total: 1000 },
    isLoading: false,
  }),
  useCreateAccount: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateAccount: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteAccount: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useSubscriptions: () => ({
    data: [
      {
        id: '1',
        name: 'Netflix',
        amount: 50,
        billing_cycle: 'monthly',
        next_billing_date: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
  useCreateSubscription: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateSubscription: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteSubscription: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useSubscriptionTotal: () => ({
    data: { total: 150 },
    isLoading: false,
  }),
  useUpsertSubscription: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useScrollDirection: () => 'up',
  useOnlineStatus: () => true,
  useTransactions: () => ({
    data: [],
    isLoading: false,
  }),
  useAllTransactions: () => ({
    data: [],
    isLoading: false,
  }),
  useTransaction: () => ({
    data: null,
    isLoading: false,
  }),
  useRecentTransactions: () => ({
    data: [],
    isLoading: false,
  }),
  useTransactionsByCategory: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteTransaction: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteTransactions: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCategories: () => ({
    data: [],
    isLoading: false,
  }),
  useFavoriteCategories: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateCategory: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateCategory: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteCategory: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCheckCategoryUsage: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useToggleFavoriteCategory: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useFreeBalance: () => ({
    data: { freeBalance: 1000, currentBalance: 1500, breakdown: [] },
    isLoading: false,
  }),
  usePaymentSummary: () => ({
    data: null,
    isLoading: false,
  }),
  useAccountsPayable: () => ({
    data: [],
    isLoading: false,
  }),
  useInstallmentProjection: () => ({
    data: [],
    isLoading: false,
  }),
  useInstallments: () => ({
    data: [],
    isLoading: false,
  }),
  useMonthlyComparison: () => ({
    data: null,
    isLoading: false,
  }),
  useMonthlyTrend: () => ({
    data: [],
    isLoading: false,
  }),
  useHousehold: () => ({
    data: null,
    isLoading: false,
  }),
  useHouseholdMembers: () => ({
    data: [],
    isLoading: false,
  }),
  useUpdateHousehold: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateMemberDisplayName: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateMemberRole: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRemoveMember: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  usePendingInvites: () => ({
    data: [],
    isLoading: false,
  }),
  useCreateInvite: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCancelInvite: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useAcceptInvite: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useSmartCategorySearch: () => ({
    data: [],
    isLoading: false,
  }),
  usePWAInstall: () => ({
    canInstall: false,
    install: vi.fn(),
  }),
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

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

describe('WalletPage', () => {
  it('should render with cards tab active by default', () => {
    renderWithProviders(<WalletPage />);

    expect(screen.getByText('Cartões')).toBeInTheDocument();
    expect(screen.getByText('Nubank')).toBeInTheDocument();
  });

  it('should switch to accounts tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WalletPage />);

    const contasTab = screen.getByRole('button', { name: /contas/i });
    await user.click(contasTab);

    expect(screen.getAllByText('Conta Corrente').length).toBeGreaterThan(0);
  });

  it('should switch to subscriptions tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WalletPage />);

    const assinaturasTab = screen.getByRole('button', { name: /assinaturas/i });
    await user.click(assinaturasTab);

    // Check that subscriptions section is displayed
    await waitFor(() => {
      expect(screen.getByText(/Minhas Assinaturas/i)).toBeInTheDocument();
    });
  });

  it('should display correct tab styling for active tab', () => {
    renderWithProviders(<WalletPage />);

    // Cards tab should be active (has specific classes)
    const cartoesButton = screen.getByRole('button', { name: /cartões/i });
    expect(cartoesButton.className).toContain('bg-white');
  });

  it('should render action buttons for cards tab', () => {
    renderWithProviders(<WalletPage />);

    // Should have simulator or other action buttons
    // Note: Depends on exact implementation
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(3); // At least tabs + action buttons
  });

  it('should handle empty states gracefully', () => {
    vi.mock('@/hooks/useCreditCards', () => ({
      useCreditCards: () => ({
        data: [],
        isLoading: false,
      }),
      useCreditUsage: () => ({
        data: null,
        isLoading: false,
      }),
    }));

    renderWithProviders(<WalletPage />);

    expect(screen.getByText('Cartões')).toBeInTheDocument();
  });
});
