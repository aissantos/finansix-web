import { describe, it, expect } from 'vitest';
import { 
  getBestCard, 
  getBalanceColor, 
  calculatePercentageChange,
  calculateMonthlyAverage,
  formatCurrency,
  calculateInstallmentTotal,
} from './calculations';
import type { CreditCardWithLimits } from '@/types';

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
      { 
        ...mockCards[0], 
        id: '3', 
        name: 'Inactive Card',
        is_active: false, 
        available_limit: 50000 
      },
    ];
    const result = getBestCard(cardsWithInactive, new Date());
    expect(result?.cardId).not.toBe('3');
    expect(result?.cardName).not.toBe('Inactive Card');
  });

  it('should return card with most days until payment', () => {
    // Testing on January 10th - after Itaú closing (5th), before Nubank closing (15th)
    const purchaseDate = new Date(2024, 0, 10);
    const result = getBestCard(mockCards, purchaseDate);
    
    expect(result).not.toBeNull();
    expect(result?.cardName).toBeDefined();
    expect(result?.reason).toContain('dias');
    expect(result?.daysUntilPayment).toBeGreaterThan(0);
  });

  it('should include available limit in recommendation', () => {
    const result = getBestCard(mockCards, new Date());
    expect(result?.availableLimit).toBeGreaterThan(0);
  });

  it('should filter by minimum limit', () => {
    const result = getBestCard(mockCards, new Date(), 10000);
    expect(result?.availableLimit).toBeGreaterThanOrEqual(10000);
  });

  it('should handle edge case: purchase on closing day', () => {
    // Purchase exactly on Nubank closing day (15th)
    const purchaseDate = new Date(2024, 0, 15);
    const result = getBestCard(mockCards, purchaseDate);
    
    expect(result).not.toBeNull();
  });

  it('should handle edge case: end of month with different days', () => {
    // February 29th (leap year edge case)
    const purchaseDate = new Date(2024, 1, 29);
    const result = getBestCard(mockCards, purchaseDate);
    
    expect(result).not.toBeNull();
  });

  it('should use limit as tiebreaker when days are equal', () => {
    const equalDayCards: CreditCardWithLimits[] = [
      {
        ...mockCards[0],
        id: 'card-a',
        closing_day: 10,
        due_day: 20,
        available_limit: 5000,
      },
      {
        ...mockCards[1],
        id: 'card-b',
        closing_day: 10,
        due_day: 20,
        available_limit: 10000, // Higher limit
      },
    ];

    const result = getBestCard(equalDayCards, new Date(2024, 0, 5));
    expect(result?.cardId).toBe('card-b'); // Should pick higher limit
  });
});

describe('getBalanceColor', () => {
  it('should return income color for positive values', () => {
    expect(getBalanceColor(100)).toBe('text-income');
    expect(getBalanceColor(0.01)).toBe('text-income');
    expect(getBalanceColor(1000000)).toBe('text-income');
  });

  it('should return expense color for negative values', () => {
    expect(getBalanceColor(-100)).toBe('text-expense');
    expect(getBalanceColor(-0.01)).toBe('text-expense');
    expect(getBalanceColor(-1000000)).toBe('text-expense');
  });

  it('should return neutral color for zero', () => {
    expect(getBalanceColor(0)).toBe('text-slate-400');
    expect(getBalanceColor(-0)).toBe('text-slate-400');
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

  it('should handle decimals correctly', () => {
    const result = calculatePercentageChange(33.33, 100);
    expect(result).toBeCloseTo(-66.67, 1);
  });
});

describe('calculateMonthlyAverage', () => {
  it('should calculate average correctly', () => {
    const values = [100, 200, 300];
    expect(calculateMonthlyAverage(values)).toBe(200);
  });

  it('should handle empty array', () => {
    expect(calculateMonthlyAverage([])).toBe(0);
  });

  it('should handle single value', () => {
    expect(calculateMonthlyAverage([500])).toBe(500);
  });

  it('should handle decimals', () => {
    const values = [10.5, 20.5, 30.5];
    expect(calculateMonthlyAverage(values)).toBeCloseTo(20.5, 2);
  });

  it('should ignore negative values in income calculation', () => {
    const values = [100, -50, 200];
    expect(calculateMonthlyAverage(values, { excludeNegative: true })).toBe(150);
  });
});

describe('formatCurrency', () => {
  it('should format positive values correctly', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('should format negative values correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-R$ 1.234,56');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1234567.89)).toBe('R$ 1.234.567,89');
  });

  it('should round cents correctly', () => {
    expect(formatCurrency(10.999)).toBe('R$ 11,00');
    expect(formatCurrency(10.995)).toBe('R$ 11,00');
  });

  it('should support compact notation', () => {
    expect(formatCurrency(1500000, { compact: true })).toMatch(/1[,.]5\s?mi/i);
  });
});

describe('calculateInstallmentTotal', () => {
  it('should calculate total from installments correctly', () => {
    const installments = [
      { amount: 100, status: 'pending' },
      { amount: 100, status: 'pending' },
      { amount: 100, status: 'paid' },
    ];
    
    expect(calculateInstallmentTotal(installments)).toBe(300);
  });

  it('should filter by status when specified', () => {
    const installments = [
      { amount: 100, status: 'pending' },
      { amount: 100, status: 'pending' },
      { amount: 100, status: 'paid' },
    ];
    
    expect(calculateInstallmentTotal(installments, { status: 'pending' })).toBe(200);
    expect(calculateInstallmentTotal(installments, { status: 'paid' })).toBe(100);
  });

  it('should handle empty array', () => {
    expect(calculateInstallmentTotal([])).toBe(0);
  });

  it('should handle decimals correctly', () => {
    const installments = [
      { amount: 33.33, status: 'pending' },
      { amount: 33.33, status: 'pending' },
      { amount: 33.34, status: 'pending' },
    ];
    
    expect(calculateInstallmentTotal(installments)).toBeCloseTo(100, 2);
  });
});
