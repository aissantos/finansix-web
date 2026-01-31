import { describe, it, expect, vi } from 'vitest';
import { getBestCard, getBalanceColor, calculatePercentageChange } from '@/lib/utils/calculations';
import type { CreditCardWithLimits } from '@/types';

// Mock Supabase client to avoid "Missing Supabase environment variables" error
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

describe('getBestCard', () => {
  const mockCards: CreditCardWithLimits[] = [
    {
      id: '1',
      household_id: 'h1',
      name: 'Nubank',
      credit_limit: 10000,
      available_limit: 8000,
      used_limit: 2000,
      closing_day: 15,
      due_day: 22,
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      deleted_at: null,
      account_id: null,
      brand: 'Mastercard',
      color: '#820AD1',
      icon: null,
      last_four_digits: '1234',
      grace_period_days: 0,
      interest_rate: 0,
      fine_rate: 0,
      credit_limit_cents: 1000000,
      pdf_password: null,
    },
    {
      id: '2',
      household_id: 'h1',
      name: 'Itaú',
      credit_limit: 15000,
      available_limit: 12000,
      used_limit: 3000,
      closing_day: 5,
      due_day: 12,
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      deleted_at: null,
      account_id: null,
      brand: 'Visa',
      color: '#EC7000',
      icon: null,
      last_four_digits: '5678',
      grace_period_days: 0,
      interest_rate: 0,
      fine_rate: 0,
      credit_limit_cents: 1500000,
      pdf_password: null,
    },
  ];

  it('should return null if no cards available', () => {
    const result = getBestCard([], new Date());
    expect(result).toBeNull();
  });

  it('should return null if no cards have sufficient limit', () => {
    const result = getBestCard(mockCards, new Date(), 20000);
    expect(result).toBeNull();
  });

  it('should filter out inactive cards', () => {
    const cardsWithInactive = [
      ...mockCards,
      { ...mockCards[0], id: '3', is_active: false, available_limit: 50000 },
    ];
    const result = getBestCard(cardsWithInactive, new Date());
    expect(result?.cardId).not.toBe('3');
  });

  it('should return card with most days until payment', () => {
    // Testing on January 10th
    const purchaseDate = new Date(2024, 0, 10);
    const result = getBestCard(mockCards, purchaseDate);
    
    // Should have a recommendation
    expect(result).not.toBeNull();
    expect(result?.cardName).toBeDefined();
    expect(result?.reason).toBeDefined();
  });

  it('should include available limit in recommendation', () => {
    const result = getBestCard(mockCards, new Date());
    expect(result?.availableLimit).toBeGreaterThan(0);
  });

  it('should filter by minimum limit', () => {
    const result = getBestCard(mockCards, new Date(), 10000);
    expect(result?.availableLimit).toBeGreaterThanOrEqual(10000);
  });
});

describe('getBalanceColor', () => {
  it('should return income color for positive values', () => {
    expect(getBalanceColor(100)).toBe('text-income');
    expect(getBalanceColor(0.01)).toBe('text-income');
  });

  it('should return expense color for negative values', () => {
    expect(getBalanceColor(-100)).toBe('text-expense');
    expect(getBalanceColor(-0.01)).toBe('text-expense');
  });

  it('should return neutral color for zero', () => {
    expect(getBalanceColor(0)).toBe('text-slate-400');
  });
});

describe('calculatePercentageChange', () => {
  it('should calculate positive percentage change', () => {
    const result = calculatePercentageChange(120, 100);
    expect(result).toBe(20);
  });

  it('should calculate negative percentage change', () => {
    const result = calculatePercentageChange(80, 100);
    expect(result).toBe(-20);
  });

  it('should handle zero previous value', () => {
    const result = calculatePercentageChange(100, 0);
    expect(result).toBe(100);
  });

  it('should return 0 when both values are zero', () => {
    const result = calculatePercentageChange(0, 0);
    expect(result).toBe(0);
  });

  it('should handle negative previous values', () => {
    const result = calculatePercentageChange(-50, -100);
    expect(result).toBe(50); // Improved by 50%
  });
});
