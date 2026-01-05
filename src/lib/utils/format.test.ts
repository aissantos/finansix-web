import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  formatDate, 
  formatDateRelative,
  formatCardNumber,
  formatMonthShort,
} from '@/lib/utils/format';

describe('formatCurrency', () => {
  it('should format positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });

  it('should format negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-R$ 1.234,56');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });

  it('should handle large numbers', () => {
    expect(formatCurrency(1234567.89)).toBe('R$ 1.234.567,89');
  });

  it('should handle small decimal numbers', () => {
    expect(formatCurrency(0.01)).toBe('R$ 0,01');
  });
});

describe('formatDate', () => {
  it('should format date with default pattern', () => {
    const date = new Date(2024, 0, 15);
    expect(formatDate(date)).toBe('15/01/2024');
  });

  it('should format date with custom pattern', () => {
    const date = new Date(2024, 0, 15);
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15');
  });

  it('should handle string dates', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024');
  });
});

describe('formatCardNumber', () => {
  it('should format 4-digit suffix', () => {
    expect(formatCardNumber('1234')).toBe('•••• 1234');
  });

  it('should handle shorter numbers', () => {
    expect(formatCardNumber('12')).toBe('•••• 12');
  });
});

describe('formatMonthShort', () => {
  it('should format month name in Portuguese', () => {
    const jan = new Date(2024, 0, 1);
    const result = formatMonthShort(jan);
    expect(result.toLowerCase()).toContain('jan');
  });
});
