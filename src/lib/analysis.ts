

export interface SpendingInsight {
  type: 'warning' | 'positive' | 'neutral';
  message: string;
  detail?: string;
  metric?: string; // e.g. "+20%", "-R$ 300"
}

interface MonthlyData {
  month: string; // yyyy-MM
  total: number;
}

/**
 * Calculates spending insights by comparing current total with history
 */
export function calculateSpendingInsights(
  currentTotal: number, 
  history: MonthlyData[],
  currentMonth: string // yyyy-MM
): SpendingInsight[] {
  if (!history || history.length < 2) return [];

  // Filter out current month from history for average calculation
  // Also filter out months *after* current month (future) just in case
  const pastMonths = history.filter(h => h.month < currentMonth);
  
  if (pastMonths.length === 0) return [];

  // Provide at least 3 months for a solid average, but work with what we have
  const relevantHistory = pastMonths.slice(-6); // Last 6 months
  const average = relevantHistory.reduce((sum, h) => sum + h.total, 0) / relevantHistory.length;

  const insights: SpendingInsight[] = [];

  // Insight 1: Deviation from Average
  const diff = currentTotal - average;
  const percentDiff = average > 0 ? (diff / average) * 100 : 0;

  if (percentDiff > 20) {
    insights.push({
      type: 'warning',
      message: 'Gastos acima da média',
      detail: `Sua fatura está ${Math.round(percentDiff)}% maior que a média dos últimos ${relevantHistory.length} meses.`,
      metric: `+${Math.round(percentDiff)}%`
    });
  } else if (percentDiff < -15) {
    insights.push({
      type: 'positive',
      message: 'Economia detectada',
      detail: `Você gastou ${Math.round(Math.abs(percentDiff))}% a menos que sua média recente.`,
      metric: `${Math.round(percentDiff)}%`
    });
  }

  // Insight 2: Highest Expense (requires transaction breakdown, maybe added later)
  
  return insights;
}
