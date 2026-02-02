import { describe, it, expect } from 'vitest';
import { bradescoParser } from './bradesco';

const BRADESCO_SAMPLE = `
Bradescard
Vencimento 20/06/2026
Total desta fatura R$ 3.500,00

DETALHAMENTO
10/06/2026 LOJAS RENNER 150,00
15/06/2026 POSTO IPIRANGA 200,50
`;

describe('Bradesco Parser', () => {
    it('should detect valid Bradesco text', () => {
        expect(bradescoParser.detectBank('fatura bradesco visa')).toBe(true);
        expect(bradescoParser.detectBank('cartão bradescard')).toBe(true);
        expect(bradescoParser.detectBank('Nubank')).toBe(false);
    });

    it('should parse metadata correctly', () => {
        const metadata = bradescoParser.parseMetadata(BRADESCO_SAMPLE);
        expect(metadata.bankName).toBe('Bradesco');
        expect(metadata.dueDate).toBe('2026-06-20');
        expect(metadata.totalAmount).toBe(3500.00);
    });

    it('should parse transactions correctly', () => {
        const transactions = bradescoParser.parseTransactions(BRADESCO_SAMPLE);
        expect(transactions).toHaveLength(2);
        
        expect(transactions[0].description).toBe('LOJAS RENNER');
        expect(transactions[0].amount).toBe(150.00);
        // Date format YYYY-MM-DD
        expect(transactions[0].date).toBe('2026-06-10');

        expect(transactions[1].description).toBe('POSTO IPIRANGA');
        expect(transactions[1].amount).toBe(200.50);
        expect(transactions[1].date).toBe('2026-06-15');
    });
});
