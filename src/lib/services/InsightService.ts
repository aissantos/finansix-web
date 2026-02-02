import type { Transaction } from '@/types';
import type { Insight } from '@/types/insights';
import { differenceInDays } from 'date-fns';

// Helper to group transactions
const groupBy = <T>(array: T[], keyCallback: (item: T) => string) => {
    return array.reduce((acc, item) => {
        const key = keyCallback(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, T[]>);
};

export class InsightService {
    
    /**
     * Detects categories where spending has increased significantly compared to last month.
     */
    static analyzeTrends(
        currentTransactions: Transaction[], 
        previousTransactions: Transaction[],
        categories: { id: string, name: string }[]
    ): Insight[] {
        const currentByCat = groupBy(currentTransactions, t => t.category_id || 'uncategorized');
        const previousByCat = groupBy(previousTransactions, t => t.category_id || 'uncategorized');

        const insights: Insight[] = [];

        for (const catId of Object.keys(currentByCat)) {
            if (catId === 'uncategorized') continue;

            const currentSum = currentByCat[catId].reduce((sum, t) => sum + t.amount, 0);
            const previousSum = previousByCat[catId]?.reduce((sum, t) => sum + t.amount, 0) || 0;

            if (previousSum > 50 && currentSum > previousSum * 1.2) { // Thresholds: >50 BRL base, >20% increase
                const catName = categories.find(c => c.id === catId)?.name || 'Categoria Desconhecida';
                const percentIncrease = Math.round(((currentSum - previousSum) / previousSum) * 100);

                insights.push({
                    id: `trend-${catId}`,
                    type: 'warning',
                    title: 'Aumento de Gastos',
                    message: `Seus gastos em ${catName} subiram ${percentIncrease}% em relação ao mês anterior.`,
                    metric: `+${percentIncrease}%`,
                    dismissible: true
                });
            }
        }

        return insights;
    }

    /**
     * Detects potential recurring subscriptions based on identical amounts and description similarity.
     * Looks for 3+ occurrences with regular intervals.
     */
    static detectSubscriptions(transactions: Transaction[]): Insight[] {
        // Group by normalized description (simple normalization)
        const normalized = groupBy(transactions, t => t.description.toLowerCase().trim());
        const insights: Insight[] = [];

        for (const desc in normalized) {
            const txs = normalized[desc];
            if (txs.length < 3) continue;

            // Check consistency of amount
            const amounts = txs.map(t => t.amount);
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const isConsistent = amounts.every(a => Math.abs(a - avgAmount) < 1.00); // 1 BRL tolerance

            if (!isConsistent) continue;
            
            // Should check intervals (approx 30 days) - simplified for MVP
            const sortedDates = txs.map(t => new Date(t.transaction_date)).sort((a,b) => a.getTime() - b.getTime());
            let isMonthly = true;
            for(let i = 1; i < sortedDates.length; i++) {
                const diff = differenceInDays(sortedDates[i], sortedDates[i-1]);
                if (diff < 25 || diff > 35) { // Allow 25-35 day interval
                    isMonthly = false; 
                    break;
                }
            }

            if (isMonthly) {
                insights.push({
                    id: `sub-${desc.replace(/\s+/g, '-')}`,
                    type: 'info',
                    title: 'Possível Assinatura Detectada',
                    message: `Identificamos um pagamento recorrente para "${desc}" de R$ ${avgAmount.toFixed(2)}.`,
                    actionLabel: 'Verificar',
                    dismissible: true
                });
            }
        }

        return insights;
    }

    /**
     * Identify single large transactions that are outliers.
     */
    static detectOutliers(transactions: Transaction[], multiplier = 3.0): Insight[] {
        if (transactions.length < 10) return [];

        const amounts = transactions.map(t => t.amount);
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        
        const outliers = transactions.filter(t => t.amount > avg * multiplier);
        
        return outliers.map(t => ({
            id: `outlier-${t.id}`,
            type: 'warning',
            title: 'Gasto Atípico',
            message: `A transação "${t.description}" de R$ ${t.amount.toFixed(2)} é bem maior que sua média.`,
            dismissible: true
        }));
    }
}
