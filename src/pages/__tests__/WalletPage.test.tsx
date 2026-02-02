import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletPage from '@/pages/WalletPage';
import { renderWithProviders } from '@/test/test-utils';

vi.mock('@/hooks/useCreditCards', () => ({
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
  useCreditUsage: () => ({
    data: { used: 2000, limit: 5000, percentage: 40 },
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useAccounts', () => ({
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
}));

vi.mock('@/hooks/useSubscriptions', () => ({
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

    expect(screen.getByText('Conta Corrente')).toBeInTheDocument();
  });

  it('should switch to subscriptions tab when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WalletPage />);

    const assinaturasTab = screen.getByRole('button', { name: /assinaturas/i });
    await user.click(assinaturasTab);

    expect(screen.getByText('Netflix')).toBeInTheDocument();
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
