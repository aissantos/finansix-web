import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionItem } from '../TransactionItem';
import { render } from '@/test/test-utils';
import type { TransactionWithDetails } from '@/types';

describe('TransactionItem', () => {
  const mockTransaction: TransactionWithDetails = {
    id: '123',
    household_id: 'household-1',
    description: 'Supermercado',
    amount: 150.50,
    type: 'expense',
    transaction_date: '2026-01-12',
    category_id: 'cat-1',
    account_id: null,
    credit_card_id: null,
    status: 'completed',
    notes: null,
    is_installment: false,
    total_installments: null,
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z',
    deleted_at: null,
    category: {
      id: 'cat-1',
      name: 'Alimentação',
      icon: 'utensils',
      color: '#ef4444',
      type: 'expense',
      household_id: 'household-1',
      is_favorite: false,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      deleted_at: null,
    },
    installments: [],
  };

  it('should render transaction description', () => {
    render(<TransactionItem transaction={mockTransaction} />);
    
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
  });

  it('should render transaction category', () => {
    render(<TransactionItem transaction={mockTransaction} />);
    
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
  });

  it('should render transaction amount with expense formatting', () => {
    render(<TransactionItem transaction={mockTransaction} />);
    
    const amountElement = screen.getByText(/150,50/);
    expect(amountElement).toBeInTheDocument();
    expect(amountElement.textContent).toContain('-'); // Expense should have minus sign
  });

  it('should render income transaction with positive sign', () => {
    const incomeTransaction: TransactionWithDetails = {
      ...mockTransaction,
      type: 'income',
      amount: 3000,
    };

    render(<TransactionItem transaction={incomeTransaction} />);
    
    const amountElement = screen.getByText(/3\.000,00/);
    expect(amountElement.textContent).toContain('+'); // Income should have plus sign
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<TransactionItem transaction={mockTransaction} onClick={handleClick} />);
    
    const item = screen.getByText('Supermercado').closest('div.list-card');
    if (item) {
      await user.click(item);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should show menu button when onEdit or onDelete is provided', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    
    render(
      <TransactionItem 
        transaction={mockTransaction} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
    
    expect(screen.getByLabelText('Opções da transação')).toBeInTheDocument();
  });

  it('should not show menu button when no actions are provided', () => {
    render(<TransactionItem transaction={mockTransaction} />);
    
    expect(screen.queryByLabelText('Opções da transação')).not.toBeInTheDocument();
  });

  it('should show installment badge for installment transactions', () => {
    const installmentTransaction: TransactionWithDetails = {
      ...mockTransaction,
      is_installment: true,
      total_installments: 12,
      installments: [
        {
          id: 'inst-1',
          transaction_id: '123',
          household_id: 'household-1',
          credit_card_id: null,
          installment_number: 3,
          amount: 50,
          billing_month: '2026-01-01',
          due_date: '2026-01-15',
          status: 'pending',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          deleted_at: null,
        },
      ],
    };

    render(<TransactionItem transaction={installmentTransaction} />);
    
    expect(screen.getByText('3/12')).toBeInTheDocument();
  });

  it('should render "Sem categoria" when category is null', () => {
    const transactionWithoutCategory: TransactionWithDetails = {
      ...mockTransaction,
      category: null,
      category_id: null,
    };

    render(<TransactionItem transaction={transactionWithoutCategory} />);
    
    expect(screen.getByText('Sem categoria')).toBeInTheDocument();
  });

  it('should open menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    
    render(
      <TransactionItem 
        transaction={mockTransaction} 
        onEdit={handleEdit}
      />
    );
    
    const menuButton = screen.getByLabelText('Opções da transação');
    await user.click(menuButton);
    
    expect(screen.getByText('Editar')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    
    render(
      <TransactionItem 
        transaction={mockTransaction} 
        onEdit={handleEdit}
      />
    );
    
    // Open menu
    const menuButton = screen.getByLabelText('Opções da transação');
    await user.click(menuButton);
    
    // Click edit
    const editButton = screen.getByText('Editar');
    await user.click(editButton);
    
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();
    
    render(
      <TransactionItem 
        transaction={mockTransaction} 
        onDelete={handleDelete}
      />
    );
    
    // Open menu
    const menuButton = screen.getByLabelText('Opções da transação');
    await user.click(menuButton);
    
    // Click delete
    const deleteButton = screen.getByText('Excluir');
    await user.click(deleteButton);
    
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});
