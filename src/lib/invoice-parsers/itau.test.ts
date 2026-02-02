import { describe, it, expect } from 'vitest';
import { itauParser } from './itau';

const ITAU_SAMPLE = `
Sua fatura chegou
Vencimento 15/05/2026
Total da fatura R$ 1.250,55

Lançamentos
10/05 IFOOD OSASCO BR 50,00
12/05 UBER *TRIP SAO PAULO 25,90
`;

describe('Itaú Parser', () => {
    it('should detect valid Itaú text', () => {
        expect(itauParser.detectBank('qualquer texto com itaú no meio')).toBe(true);
        expect(itauParser.detectBank('iuclick bank')).toBe(true);
        expect(itauParser.detectBank('Banco do Brasil')).toBe(false);
    });

    it('should parse metadata correctly', () => {
        const metadata = itauParser.parseMetadata(ITAU_SAMPLE);
        expect(metadata.bankName).toBe('Itaú');
        expect(metadata.dueDate).toBe('2026-05-15');
        expect(metadata.totalAmount).toBe(1250.55);
    });

    it('should parse transactions correctly', () => {
        const transactions = itauParser.parseTransactions(ITAU_SAMPLE);
        expect(transactions).toHaveLength(2);
        
        expect(transactions[0].description).toBe('IFOOD OSASCO BR');
        expect(transactions[0].amount).toBe(50.00);
        
        expect(transactions[1].description).toBe('UBER *TRIP SAO PAULO');
        expect(transactions[1].amount).toBe(25.90);
    });
});
