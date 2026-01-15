import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionItem } from '../SubscriptionItem';
import { render } from '@/test/test-utils';
import type { Subscription } from '@/hooks/useSubscriptions';

describe('SubscriptionItem', () => {
  const mockSubscription: Subscription = {
    id: 'sub-1',
    household_id: 'household-1',
    name: 'Netflix',
    amount: 45.90,
    billing_day: 15,
    billing_cycle: 'monthly',
    category_id: null,
    credit_card_id: 'card-1',
    account_id: null,
    is_active: true,
    start_date: '2026-01-01',
    end_date: null,
    icon: '📺',
    color: '#E50914',
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
  };

  const mockCard = {
    name: 'Nubank',
    last_four_digits: '1234',
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
  };

  it('should render subscription name', () => {
    render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('should render subscription amount', () => {
    render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    // Amount may appear twice (in main display and in upcoming banner)
    const amountElements = screen.getAllByText('R$ 45,90');
    expect(amountElements.length).toBeGreaterThan(0);
    expect(screen.getByText('/mês')).toBeInTheDocument();
  });

  it('should render subscription icon', () => {
    const { container } = render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    expect(container.textContent).toContain('📺');
  });

  it('should render card information when provided', () => {
    render(<SubscriptionItem subscription={mockSubscription} card={mockCard} {...mockHandlers} />);
    
    expect(screen.getByText(/Nubank/)).toBeInTheDocument();
    expect(screen.getByText(/••1234/)).toBeInTheDocument();
  });

  it('should show inactive indicator when subscription is not active', () => {
    const inactiveSubscription: Subscription = {
      ...mockSubscription,
      is_active: false,
    };

    const { container } = render(<SubscriptionItem subscription={inactiveSubscription} {...mockHandlers} />);
    
    // Should have pause icon
    const pauseIcon = container.querySelector('svg.lucide-pause');
    expect(pauseIcon).toBeInTheDocument();
  });

  it('should display billing day information', () => {
    const { container } = render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    // Should show billing day info (either "Dia 15" or "Em X dias" depending on current date)
    // Should show billing day info (either "Dia 15", "Em X dias" or "Cobra hoje!" depending on current date)
    const hasStaticDay = container.textContent?.includes('Dia 15');
    const hasUpcomingDay = container.textContent?.includes('Em') && container.textContent?.includes('dia');
    const hasToday = container.textContent?.includes('Cobra hoje!');
    expect(hasStaticDay || hasUpcomingDay || hasToday).toBe(true);
  });

  it('should open menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    const menuButton = screen.getByRole('button', { name: '' }); // MoreVertical button
    await user.click(menuButton);
    
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Excluir')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);
    
    // Click edit
    const editButton = screen.getByText('Editar');
    await user.click(editButton);
    
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);
    
    // Click delete
    const deleteButton = screen.getByText('Excluir');
    await user.click(deleteButton);
    
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should show pause/reactivate button when onToggleActive is provided', async () => {
    const user = userEvent.setup();
    
    render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);
    
    // Should show "Pausar" for active subscription
    expect(screen.getByText('Pausar')).toBeInTheDocument();
  });

  it('should call onToggleActive when pause/reactivate button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<SubscriptionItem subscription={mockSubscription} {...mockHandlers} />);
    
    // Open menu
    const menuButton = screen.getByRole('button', { name: '' });
    await user.click(menuButton);
    
    // Click pause
    const pauseButton = screen.getByText('Pausar');
    await user.click(pauseButton);
    
    expect(mockHandlers.onToggleActive).toHaveBeenCalledTimes(1);
  });
});
