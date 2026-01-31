
import { describe, it, expect, vi } from 'vitest';
import { parseInvoiceText } from './invoice-parser';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
  version: '1.0.0'
}));

describe('Real PDF Fragmentation Logic', () => {
    it('should parse transactions with deep fragmentation (Date -> Card -> Desc -> Amount)', () => {

        
        // Clean up the line numbers from my debug view simulation if I copy-pasted,
        // but the above string includes them as if they were part of text? 
        // No, I should use the clean text format.
        
        const cleanText = `
        30 DEZ
         
        •••• 8658
         
        Braz Luis de Mesquita
         
        R$ 26,28
        
        04 JAN
         
        •••• 8658
         
        Nalvaaørs Restaurante
         
        R$ 44,00
        `;

        const result = parseInvoiceText(cleanText);
        
        console.log('Deep Frag Transactions:', result.transactions);
        
        expect(result.transactions).toHaveLength(2);
        
        const t1 = result.transactions[0];
        expect(t1.description).toBe('Braz Luis de Mesquita');
        expect(t1.amount).toBe(26.28);
        expect(t1.date).toContain('-12-30'); // Year dynamic check omitted
        
        const t2 = result.transactions[1];
        expect(t2.description).toBe('Nalvaaørs Restaurante');
        expect(t2.amount).toBe(44.00);
    });
});
