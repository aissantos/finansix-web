import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreditCardItem } from '../CreditCardItem';
import { render } from '@/test/test-utils';
import type { CreditCardWithLimits } from '@/types';

describe('CreditCardItem', () => {
  const mockCard: CreditCardWithLimits = {
    id: 'card-1',
    household_id: 'household-1',
    name: 'Nubank Ultravioleta',
    brand: 'Mastercard',
    last_four_digits: '1234',
    credit_limit: 10000,
    closing_day: 15,
    due_day: 25,
    color: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    used_limit: 3000,
    available_limit: 7000,
  };

  it('should render card name', () => {
    render(<CreditCardItem card={mockCard} />);
    
    expect(screen.getByText('Nubank Ultravioleta')).toBeInTheDocument();
  });

  it('should render card brand and last digits', () => {
    render(<CreditCardItem card={mockCard} />);
    
    expect(screen.getByText(/Mastercard/)).toBeInTheDocument();
    expect(screen.getByText(/1234/)).toBeInTheDocument();
  });

  it('should render used limit (fatura atual)', () => {
    render(<CreditCardItem card={mockCard} />);
    
    expect(screen.getByText('Fatura Atual')).toBeInTheDocument();
    expect(screen.getByText(/3\.000,00/)).toBeInTheDocument();
  });

  it('should render available limit', () => {
    render(<CreditCardItem card={mockCard} />);
    
    expect(screen.getByText('Disponível')).toBeInTheDocument();
    expect(screen.getByText(/7\.000,00/)).toBeInTheDocument();
  });

  it('should render credit limit', () => {
    render(<CreditCardItem card={mockCard} />);
    
    expect(screen.getByText(/Limite: R\$ 10\.000,00/)).toBeInTheDocument();
  });

  it('should calculate and display usage percentage', () => {
    render(<CreditCardItem card={mockCard} />);
    
    // 3000 / 10000 = 30%
    expect(screen.getByText('30% usado')).toBeInTheDocument();
  });

  it('should render usage percentage at 100% when fully used', () => {
    const card: CreditCardWithLimits = {
      ...mockCard,
      used_limit: 10000,
      available_limit: 0,
    };

    render(<CreditCardItem card={card} />);
    
    expect(screen.getByText('100% usado')).toBeInTheDocument();
  });

  it('should render usage percentage at 0% when not used', () => {
    const card: CreditCardWithLimits = {
      ...mockCard,
      used_limit: 0,
      available_limit: 10000,
    };

    render(<CreditCardItem card={card} />);
    
    expect(screen.getByText('0% usado')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<CreditCardItem card={mockCard} onClick={handleClick} />);
    
    const item = screen.getByText('Nubank Ultravioleta').closest('div.list-card');
    if (item) {
      await user.click(item);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should show menu button with ARIA label', () => {
    const handleEdit = vi.fn();
    
    render(<CreditCardItem card={mockCard} onEdit={handleEdit} />);
    
    expect(screen.getByLabelText('Opções do cartão')).toBeInTheDocument();
  });

  it('should open menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    
    render(<CreditCardItem card={mockCard} onEdit={handleEdit} />);
    
    const menuButton = screen.getByLabelText('Opções do cartão');
    await user.click(menuButton);
    
    expect(screen.getByText('Editar')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    
    render(<CreditCardItem card={mockCard} onEdit={handleEdit} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Opções do cartão');
    await user.click(menuButton);
    
    // Click edit
    const editButton = screen.getByText('Editar');
    await user.click(editButton);
    
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();
    
    render(<CreditCardItem card={mockCard} onDelete={handleDelete} />);
    
    // Open menu
    const menuButton = screen.getByLabelText('Opções do cartão');
    await user.click(menuButton);
    
    // Click delete
    const deleteButton = screen.getByText('Excluir');
    await user.click(deleteButton);
    
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('should detect Nubank brand color from name', () => {
    const { container } = render(<CreditCardItem card={mockCard} />);
    
    const topBar = container.querySelector('.absolute.top-0');
    expect(topBar).toHaveClass('bg-card-nubank');
  });

  it('should use custom color when provided', () => {
    const card: CreditCardWithLimits = {
      ...mockCard,
      color: '#FF5733',
    };

    const { container } = render(<CreditCardItem card={card} />);
    
    const topBar = container.querySelector('.absolute.top-0');
    expect(topBar).toHaveStyle({ backgroundColor: '#FF5733' });
  });

  it('should handle card with no last digits', () => {
    const card: CreditCardWithLimits = {
      ...mockCard,
      last_four_digits: null,
    };

    render(<CreditCardItem card={card} />);
    
    expect(screen.getByText(/Mastercard/)).toBeInTheDocument();
  });

  it('should round usage percentage correctly', () => {
    const card: CreditCardWithLimits = {
      ...mockCard,
      used_limit: 3333,
      available_limit: 6667,
      credit_limit: 10000,
    };

    render(<CreditCardItem card={card} />);
    
    // 3333 / 10000 = 33.33% → rounds to 33%
    expect(screen.getByText('33% usado')).toBeInTheDocument();
  });
});
