/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  toCents,
  toReais,
  addCents,
  subtractCents,
  multiplyCents,
  divideCents,
  calculateFreeBalance,
  getBestCard,
  getBalanceColor,
  getBalanceBgColor,
  calculatePercentageChange,
  calculateMonthlyAverage,
  calculateInstallmentTotal
} from '@/lib/utils/calculations';
import * as supabaseModule from '@/lib/supabase/client';
import type { CreditCardWithLimits } from '@/types';

vi.mock('@/lib/supabase/client');

describe('Monetary Utilities (Cents-based)', () => {
  describe('toCents', () => {
    it('should convert reais to cents correctly', () => {
      expect(toCents(123.45)).toBe(12345);
      expect(toCents(100)).toBe(10000);
      expect(toCents(0.01)).toBe(1);
    });

    it('should round correctly', () => {
      expect(toCents(123.456)).toBe(12346); // rounds up
      expect(toCents(123.454)).toBe(12345); // rounds down
    });
  });

  describe('toReais', () => {
    it('should convert cents to reais correctly', () => {
      expect(toReais(12345)).toBe(123.45);
      expect(toReais(10000)).toBe(100);
      expect(toReais(1)).toBe(0.01);
    });
  });

  describe('addCents', () => {
    it('should add multiple amounts in cents', () => {
      expect(addCents(100, 200, 300)).toBe(600);
      expect(addCents(1000)).toBe(1000);
      expect(addCents()).toBe(0);
    });
  });

  describe('subtractCents', () => {
    it('should subtract amounts in cents', () => {
      expect(subtractCents(1000, 300)).toBe(700);
      expect(subtractCents(100, 200)).toBe(-100);
    });
  });

  describe('multiplyCents', () => {
    it('should multiply cents by factor', () => {
      expect(multiplyCents(100, 2)).toBe(200);
      expect(multiplyCents(100, 1.5)).toBe(150);
      expect(multiplyCents(100, 0.5)).toBe(50);
    });

    it('should round result', () => {
      expect(multiplyCents(100, 1.556)).toBe(156);
    });
  });

  describe('divideCents', () => {
    it('should divide cents amount', () => {
      expect(divideCents(300, 3)).toBe(100);
      expect(divideCents(100, 2)).toBe(50);
    });

    it('should round result', () => {
      expect(divideCents(100, 3)).toBe(33);
    });
  });
});

describe('calculateFreeBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate correct free balance with basic data', async () => {
    // Setup mocks for each table query
    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation(() => {
      callCount++;

      const createMockChain = (data: any[], error: any = null) => {
        const chain: any = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.lte = vi.fn().mockReturnValue(chain);
        chain.gte = vi.fn().mockReturnValue(chain);
        chain.is = vi.fn().mockReturnValue(chain);
        chain.in = vi.fn().mockReturnValue(chain);
        chain.or = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (value: any) => void) => resolve({ data, error });
        return chain;
      };

      // First call: accounts
      if (callCount === 1) {
        return createMockChain([{ current_balance: 1000 }]);
      }

      // All other calls return empty arrays
      return createMockChain([]);
    });

    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue({ from: mockFrom } as any);

    const result = await calculateFreeBalance(
      'test-household-id',
      new Date(),
      false
    );

    expect(result.currentBalance).toBe(1000);
    expect(result.freeBalance).toBe(1000);
    expect(result.pendingExpenses).toBe(0);
  });

  it('should deduct pending expenses from free balance', async () => {
    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation(() => {
      callCount++;

      const createMockChain = (data: any[], error: any = null) => {
        const chain: any = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.lte = vi.fn().mockReturnValue(chain);
        chain.gte = vi.fn().mockReturnValue(chain);
        chain.is = vi.fn().mockReturnValue(chain);
        chain.in = vi.fn().mockReturnValue(chain);
        chain.or = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (value: any) => void) => resolve({ data, error });
        return chain;
      };

      // First call: accounts
      if (callCount === 1) {
        return createMockChain([{ current_balance: 1000 }]);
      }

      // Second call: pending expenses (transactions)
      if (callCount === 2) {
        return createMockChain([{ amount: -200 }]);
      }

      return createMockChain([]);
    });

    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue({ from: mockFrom } as any);

    const result = await calculateFreeBalance(
      'test-household-id',
      new Date(),
      false
    );

    expect(result.currentBalance).toBe(1000);
    expect(result.pendingExpenses).toBe(200);
    expect(result.freeBalance).toBe(800);
  });

  it('should include projections when enabled', async () => {
    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation(() => {
      callCount++;

      const createMockChain = (data: any[], error: any = null) => {
        const chain: any = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.lte = vi.fn().mockReturnValue(chain);
        chain.gte = vi.fn().mockReturnValue(chain);
        chain.is = vi.fn().mockReturnValue(chain);
        chain.in = vi.fn().mockReturnValue(chain);
        chain.or = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (value: any) => void) => resolve({ data, error });
        return chain;
      };

      // First call: accounts
      if (callCount === 1) {
        return createMockChain([{ current_balance: 1000 }]);
      }

      // Second call: pending expenses
      if (callCount === 2) {
        return createMockChain([]);
      }

      // Third call: installments
      if (callCount === 3) {
        return createMockChain([]);
      }

      // Fourth call: expected_transactions (projections)
      if (callCount === 4) {
        return createMockChain([
          { amount: 500, confidence_percent: 80, type: 'income' }, // 500 * 0.8 = 400
        ]);
      }

      return createMockChain([]);
    });

    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue({ from: mockFrom } as any);

    const result = await calculateFreeBalance(
      'test-household-id',
      new Date(),
      true // includeProjections
    );

    expect(result.expectedIncome).toBe(400); // 500 * 80%
    expect(result.freeBalance).toBe(1400); // 1000 + 400
  });

  it('should handle multiple accounts correctly', async () => {
    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation(() => {
      callCount++;

      const createMockChain = (data: any[], error: any = null) => {
        const chain: any = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.lte = vi.fn().mockReturnValue(chain);
        chain.gte = vi.fn().mockReturnValue(chain);
        chain.is = vi.fn().mockReturnValue(chain);
        chain.in = vi.fn().mockReturnValue(chain);
        chain.or = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (value: any) => void) => resolve({ data, error });
        return chain;
      };

      // First call: accounts with multiple balances
      if (callCount === 1) {
        return createMockChain([
          { current_balance: 500 },
          { current_balance: 300 },
        ]);
      }

      return createMockChain([]);
    });

    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue({ from: mockFrom } as any);

    const result = await calculateFreeBalance(
      'test-household-id',
      new Date(),
      false
    );

    expect(result.currentBalance).toBe(800); // 500 + 300
  });

  it('should return breakdown array for UI', async () => {
    const mockFrom = vi.fn().mockImplementation(() => {
      const createMockChain = (data: any[], error: any = null) => {
        const chain: any = {};
        chain.select = vi.fn().mockReturnValue(chain);
        chain.eq = vi.fn().mockReturnValue(chain);
        chain.lte = vi.fn().mockReturnValue(chain);
        chain.gte = vi.fn().mockReturnValue(chain);
        chain.is = vi.fn().mockReturnValue(chain);
        chain.in = vi.fn().mockReturnValue(chain);
        chain.or = vi.fn().mockReturnValue(chain);
        chain.then = (resolve: (value: any) => void) => resolve({ data, error });
        return chain;
      };

      return createMockChain([]);
    });

    vi.spyOn(supabaseModule, 'supabase', 'get').mockReturnValue({ from: mockFrom } as any);

    const result = await calculateFreeBalance(
      'test-household-id',
      new Date(),
      false
    );

    expect(result.breakdown).toBeDefined();
    expect(Array.isArray(result.breakdown)).toBe(true);
  });
});

describe('getBestCard', () => {
  it('should return null when no active cards available', () => {
    const cards: CreditCardWithLimits[] = [
      {
        id: '1',
        name: 'Card 1',
        is_active: false,
        available_limit: 1000,
        closing_day: 10,
        due_day: 20,
      } as CreditCardWithLimits,
    ];

    const result = getBestCard(cards);
    expect(result).toBeNull();
  });

  it('should return card with most days until payment', () => {
    const cards: CreditCardWithLimits[] = [
      {
        id: '1',
        name: 'Card 1',
        is_active: true,
        available_limit: 1000,
        closing_day: 5,
        due_day: 15,
      } as CreditCardWithLimits,
      {
        id: '2',
        name: 'Card 2',
        is_active: true,
        available_limit: 1000,
        closing_day: 20,
        due_day: 30,
      } as CreditCardWithLimits,
    ];

    const purchaseDate = new Date(2026, 1, 10); // Feb 10, 2026
    const result = getBestCard(cards, purchaseDate);

    expect(result).toBeDefined();
    // Card 1 closes next month (after purchase date > closing_day), so more days until payment
    expect(result?.cardName).toBe('Card 1');
  });

  it('should filter cards by minimum limit', () => {
    const cards: CreditCardWithLimits[] = [
      {
        id: '1',
        name: 'Card 1',
        is_active: true,
        available_limit: 500,
        closing_day: 10,
        due_day: 20,
      } as CreditCardWithLimits,
      {
        id: '2',
        name: 'Card 2',
        is_active: true,
        available_limit: 2000,
        closing_day: 10,
        due_day: 20,
      } as CreditCardWithLimits,
    ];

    const result = getBestCard(cards, new Date(), 1000);

    expect(result).toBeDefined();
    expect(result?.cardName).toBe('Card 2'); // Only Card 2 meets minimum
  });
});

describe('Helper Functions', () => {
  describe('getBalanceColor', () => {
    it('should return correct color class', () => {
      expect(getBalanceColor(100)).toBe('text-income');
      expect(getBalanceColor(-100)).toBe('text-expense');
      expect(getBalanceColor(0)).toBe('text-slate-400');
    });
  });

  describe('getBalanceBgColor', () => {
    it('should return correct background color', () => {
      expect(getBalanceBgColor(100)).toContain('bg-green');
      expect(getBalanceBgColor(-100)).toContain('bg-red');
      expect(getBalanceBgColor(0)).toContain('bg-slate');
    });
  });

  describe('calculatePercentageChange', () => {
    it('should calculate percentage change correctly', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
      expect(calculatePercentageChange(100, 200)).toBe(-50);
      expect(calculatePercentageChange(100, 0)).toBe(100);
      expect(calculatePercentageChange(0, 100)).toBe(-100); // (0-100)/100 * 100 = -100
    });
  });

  describe('calculateMonthlyAverage', () => {
    it('should calculate average from cents values', () => {
      const values = [toCents(100), toCents(200), toCents(300)];
      expect(calculateMonthlyAverage(values)).toBe(200);
    });

    it('should return 0 for empty array', () => {
      expect(calculateMonthlyAverage([])).toBe(0);
    });
  });

  describe('calculateInstallmentTotal', () => {
    it('should calculate total for installments', () => {
      const amountCents = toCents(100);
      expect(calculateInstallmentTotal(amountCents, 3)).toBe(300);
    });
  });
});
