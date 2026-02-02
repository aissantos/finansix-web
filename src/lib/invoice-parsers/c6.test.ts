import { describe, it, expect } from 'vitest';
import { c6Parser } from './c6';

const C6_SAMPLE = `
C6 BANK
Vencimento 10/06/2026
Total da fatura R$ 2.500,00

Lançamentos
10/05 UBER DO BRASIL 15,90
12/05 NETFLIX.COM 55,90
`;

describe('C6 Parser', () => {
    it('should detect valid C6 text', () => {
        expect(c6Parser.detectBank('boleto c6 bank')).toBe(true);
        expect(c6Parser.detectBank('Itaú')).toBe(false);
    });

    it('should parse metadata correctly', () => {
        const metadata = c6Parser.parseMetadata(C6_SAMPLE);
        expect(metadata.dueDate).toBe('2026-06-10');
        expect(metadata.totalAmount).toBe(2500.00);
    });

    it('should parse transactions correctly', () => {
        const transactions = c6Parser.parseTransactions(C6_SAMPLE);
        expect(transactions).toHaveLength(2);
        
        expect(transactions[0].description).toBe('UBER DO BRASIL');
        expect(transactions[0].amount).toBe(15.90);
        expect(transactions[0].date).toContain('-05-10');

        expect(transactions[1].description).toBe('NETFLIX.COM');
        expect(transactions[1].amount).toBe(55.90);
        expect(transactions[1].date).toContain('-05-12');
    });
});
