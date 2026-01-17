import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountItem } from '../AccountItem';
import { render } from '@/test/test-utils';
import type { Account } from '@/types';

describe('AccountItem', () => {
  const mockAccount: Account = {
    id: 'acc-1',
    household_id: 'household-1',
    name: 'Conta Corrente Principal',
    type: 'checking',
    currency: 'BRL',
    initial_balance: 1000,
    current_balance: 1500,
    current_balance_cents: 150000,
    color: '#3B82F6',
    icon: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    bank_code: null,
    bank_name: null,
    branch_number: null,
    account_number: null,
    account_digit: null,
    pix_key: null,
    pix_key_type: null,
  };

  it('should render account name', () => {
    render(<AccountItem account={mockAccount} />);
    
    expect(screen.getByText('Conta Corrente Principal')).toBeInTheDocument();
  });

  it('should render account type label', () => {
    render(<AccountItem account={mockAccount} />);
    
    expect(screen.getByText('Conta Corrente')).toBeInTheDocument();
  });

  it('should render current balance', () => {
    render(<AccountItem account={mockAccount} />);
    
    expect(screen.getByText(/1\.500,00/)).toBeInTheDocument();
    expect(screen.getByText('Saldo Atual')).toBeInTheDocument();
  });

  it('should render initial balance when different from current', () => {
    render(<AccountItem account={mockAccount} />);
    
    expect(screen.getByText(/1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText('Inicial')).toBeInTheDocument();
  });

  it('should not render initial balance when same as current', () => {
    const account: Account = {
      ...mockAccount,
      initial_balance: 1500,
      current_balance: 1500,
    };

    render(<AccountItem account={account} />);
    
    expect(screen.queryByText('Inicial')).not.toBeInTheDocument();
  });

  it('should render negative balance in red', () => {
    const account: Account = {
      ...mockAccount,
      current_balance: -500,
    };

    render(<AccountItem account={account} />);
    
    const balanceElement = screen.getByText('-R$ 500,00');
    expect(balanceElement).toHaveClass('text-expense');
  });

  it('should render savings account type', () => {
    const account: Account = {
      ...mockAccount,
      type: 'savings',
    };

    render(<AccountItem account={account} />);
    
    expect(screen.getByText('Poupança')).toBeInTheDocument();
  });

  it('should render investment account type', () => {
    const account: Account = {
      ...mockAccount,
      type: 'investment',
    };

    render(<AccountItem account={account} />);
    
    expect(screen.getByText('Investimento')).toBeInTheDocument();
  });

  it('should render cash account type', () => {
    const account: Account = {
      ...mockAccount,
      type: 'cash',
    };

    render(<AccountItem account={account} />);
    
    expect(screen.getByText('Dinheiro')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<AccountItem account={mockAccount} onClick={handleClick} />);
    
    const item = screen.getByText('Conta Corrente Principal').closest('div.list-card');
    if (item) {
      await user.click(item);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should show menu button with ARIA label', () => {
    const handleEdit = vi.fn();
    
    render(<AccountItem account={mockAccount} onEdit={handleEdit} />);
    
    expect(screen.getByLabelText('Opções da conta')).toBeInTheDocument();
  });

  it('should open menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    
    render(<AccountItem account={mockAccount} onEdit={handleEdit} />);
    
    const menuButton = screen.getByLabelText('Opções da conta');
    await user.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByText('Editar')).toBeInTheDocument();
    });
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    
    render(<AccountItem account={mockAccount} onEdit={handleEdit} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Opções da conta');
    await user.click(menuButton);
    
    // Click edit
    const editButton = screen.getByText('Editar');
    await user.click(editButton);
    
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();
    
    render(<AccountItem account={mockAccount} onDelete={handleDelete} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Opções da conta');
    await user.click(menuButton);
    
    // Click delete
    const deleteButton = screen.getByText('Excluir');
    await user.click(deleteButton);
    
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('should use account color for icon and top bar', () => {
    const { container } = render(<AccountItem account={mockAccount} />);
    
    const topBar = container.querySelector('.absolute.top-0');
    expect(topBar).toHaveStyle({ backgroundColor: '#3B82F6' });
  });

  it('should handle zero balance', () => {
    const account: Account = {
      ...mockAccount,
      current_balance: 0,
    };

    render(<AccountItem account={account} />);
    
    // Use getAllByText since there might be multiple "0,00" (current and initial balance)
    const balanceElements = screen.getAllByText(/0,00/);
    expect(balanceElements.length).toBeGreaterThan(0);
  });
});
