import { describe, it, expect } from 'vitest';
import { btgParser } from './btg';

const BTG_SAMPLE = `
BTG Pactual
Vencimento 15/07/2026
Valor total R$ 5.000,00

Extrato
10/06 RESTAURANTE TOP 01/01 150,00
12/06 SUPERMERCADO 300,50
`;

describe('BTG Parser', () => {
    it('should detect valid BTG text', () => {
        expect(btgParser.detectBank('fatura btg pactual')).toBe(true);
        expect(btgParser.detectBank('btg banking')).toBe(true);
        expect(btgParser.detectBank('Nubank')).toBe(false);
    });

    it('should parse metadata correctly', () => {
        const metadata = btgParser.parseMetadata(BTG_SAMPLE);
        expect(metadata.dueDate).toBe('2026-07-15');
        expect(metadata.totalAmount).toBe(5000.00);
    });

    it('should parse transactions correctly', () => {
        const transactions = btgParser.parseTransactions(BTG_SAMPLE);
        expect(transactions).toHaveLength(2);
        
        expect(transactions[0].description).toBe('RESTAURANTE TOP');
        expect(transactions[0].amount).toBe(150.00);
        expect(transactions[0].date).toContain('-06-10');

        expect(transactions[1].description).toBe('SUPERMERCADO');
        expect(transactions[1].amount).toBe(300.50);
        // Should handle description without installment part too if the regex is flexible
        expect(transactions[1].date).toContain('-06-12');
    });
});
