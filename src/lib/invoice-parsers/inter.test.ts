import { describe, it, expect } from 'vitest';
import { interParser } from './inter';

const INTER_SAMPLE = `
Banco Inter
Vencimento 10/05/2026
Valor total R$ 980,50

Transações
05/04 - UBER *TRIP R$ 15,90
07/04 - IFOOD *PEDIDO R$ 45,00
`;

describe('Inter Parser', () => {
    it('should detect valid Inter text', () => {
        expect(interParser.detectBank('banco inter')).toBe(true);
        expect(interParser.detectBank('inter mastercard')).toBe(true);
        expect(interParser.detectBank('Santander')).toBe(false);
    });

    it('should parse metadata correctly', () => {
        const metadata = interParser.parseMetadata(INTER_SAMPLE);
        expect(metadata.dueDate).toBe('2026-05-10');
        expect(metadata.totalAmount).toBe(980.50);
    });

    it('should parse transactions correctly', () => {
        const transactions = interParser.parseTransactions(INTER_SAMPLE);
        expect(transactions).toHaveLength(2);
        
        expect(transactions[0].description).toBe('UBER *TRIP');
        expect(transactions[0].amount).toBe(15.90);
        expect(transactions[0].date).toContain('-04-05'); // 05/04

        expect(transactions[1].description).toBe('IFOOD *PEDIDO');
        expect(transactions[1].amount).toBe(45.00);
        expect(transactions[1].date).toContain('-04-07'); // 07/04
    });
});
