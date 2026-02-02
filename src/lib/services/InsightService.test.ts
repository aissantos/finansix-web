/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { InsightService } from './InsightService'; // Assuming same directory for test
import type { Transaction } from '@/types';

// Mock Transaction Helper
const createTx = (id: string, amount: number, categoryId: string, description: string, date: string): Transaction => ({
    id,
    household_id: 'h1',
    amount,
    amount_cents: amount * 100,
    category_id: categoryId,
    description,
    transaction_date: date,
    created_at: date,
    updated_at: date,
    type: 'expense',
    status: 'completed',
    is_installment: false,
    total_installments: 1,
    is_reimbursable: false,
    is_recurring: false,
    reimbursed_amount: 0,
    credit_card_id: null,
    account_id: 'acc1',
    currency: 'BRL'
});

describe('InsightService', () => {
    describe('analyzeTrends', () => {
        it('should detect spending increase > 20%', () => {
            const categories = [{ id: 'cat1', name: 'Food' }];
            
            // Previous month: 100
            const prevTxs = [
                createTx('1', 100, 'cat1', 'Lunch', '2023-01-10')
            ];

            // Current month: 130 (+30%)
            const currTxs = [
                createTx('2', 130, 'cat1', 'Lunch', '2023-02-10')
            ];

            const insights = InsightService.analyzeTrends(currTxs, prevTxs, categories);
            
            expect(insights).toHaveLength(1);
            expect(insights[0].type).toBe('warning');
            expect(insights[0].metric).toBe('+30%');
        });

        it('should ignore increase if base spending is low (< 50)', () => {
             const categories = [{ id: 'cat1', name: 'Food' }];
            
            // Previous month: 20
            const prevTxs = [createTx('1', 20, 'cat1', 'Lunch', '2023-01-10')];
            // Current month: 40 (+100% but base < 50)
            const currTxs = [createTx('2', 40, 'cat1', 'Lunch', '2023-02-10')];

            const insights = InsightService.analyzeTrends(currTxs, prevTxs, categories);
            expect(insights).toHaveLength(0);
        });
    });

    describe('detectOutliers', () => {
        it('should detect outlier transaction > 3x average', () => {
            // 9 transactions of 10
            const regularTxs = Array.from({ length: 9 }, (_, i) => 
                createTx(`reg-${i}`, 10, 'cat1', 'Coffee', '2023-01-01')
            );
            
            // 1 transaction of 100 (Avg ~20)
            const outlierTx = createTx('outlier', 100, 'cat1', 'Fancy Dinner', '2023-01-01');
            
            const insights = InsightService.detectOutliers([...regularTxs, outlierTx]);
            
            expect(insights).toHaveLength(1);
            expect(insights[0].id).toContain('outlier');
        });
        
         it('should return empty if total transactions < 10', () => {
            const txs = [createTx('1', 1000, 'cat1', 'Big', '2023-01-01')];
            const insights = InsightService.detectOutliers(txs);
            expect(insights).toHaveLength(0);
         });
    });
});
