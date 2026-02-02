import { describe, it, expect } from 'vitest';
import { santanderParser } from './santander';

const SANTANDER_SAMPLE = `
SANTANDER
Vencimento 15/01/2026
Total da fatura R$ 1.234,56

Lançamentos
10 JAN UBER DO BRASIL 15,90
12 FEV NETFLIX ASSINATURA 55,90
`;

describe('Santander Parser', () => {
    it('should detect valid Santander text', () => {
        expect(santanderParser.detectBank('santander bank')).toBe(true);
        expect(santanderParser.detectBank('fatura getnet')).toBe(true);
        expect(santanderParser.detectBank('Itau')).toBe(false);
    });

    it('should parse metadata correctly', () => {
        const metadata = santanderParser.parseMetadata(SANTANDER_SAMPLE);
        expect(metadata.bankName).toBe(undefined); // Metadata interface doesn't strictly enforce bankName return here, parser handler adds it
        expect(metadata.dueDate).toBe('2026-01-15');
        expect(metadata.totalAmount).toBe(1234.56);
    });

    it('should parse transactions correctly with month conversion', () => {
        const transactions = santanderParser.parseTransactions(SANTANDER_SAMPLE);
        expect(transactions).toHaveLength(2);
        
        expect(transactions[0].description).toBe('UBER DO BRASIL');
        expect(transactions[0].amount).toBe(15.90);
        expect(transactions[0].date).toContain('-01-10'); // JAN -> 01

        expect(transactions[1].description).toBe('NETFLIX ASSINATURA');
        expect(transactions[1].amount).toBe(55.90);
        expect(transactions[1].date).toContain('-02-12'); // FEV -> 02
    });
});
