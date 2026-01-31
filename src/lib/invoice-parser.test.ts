import { describe, it, expect, vi } from 'vitest';
import { parseInvoiceText } from './invoice-parser';

// Mock pdfjs-dist to avoid Node.js environment issues
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  getDocument: vi.fn(),
  version: '1.0.0'
}));

describe('invoice-parser', () => {
  it('should extract metadata correctly from a sample text', () => {
    const text = `
      FATURA
      Vencimento 10/02/2026
      Total da fatura R$ 1.250,50
      Pagamento mínimo R$ 150,00

      05/01 Uber *Trip 25,00
      10/01 Spotify 30,00
      
      TOTAL R$ 1.250,50
    `;

    const result = parseInvoiceText(text);

    expect(result.dueDate).toBe('2026-02-10');
    expect(result.totalAmount).toBe(1250.50);
    expect(result.minimumPayment).toBe(150.00);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toEqual({
      date: '2026-01-05',
      description: 'Uber *Trip',
      amount: 25.00
    });
  });

  it('should handle Nubank format metadata', () => {
    // Test case for future implementation of different formats
    // const _text = `...`; 
  });

  it('should extract metadata with implicit year (add current year)', () => {
    const currentYear = new Date().getFullYear();
    const text = `
      Vencimento 15/03
      Total R$ 500,00
    `;

    const result = parseInvoiceText(text);
    expect(result.dueDate).toBe(`${currentYear}-03-15`);
    expect(result.totalAmount).toBe(500.00);
  });
});
