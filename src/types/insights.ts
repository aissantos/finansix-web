export type InsightType = 'warning' | 'info' | 'success' | 'neutral';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  metric?: string; // e.g. "+20%", "R$ 50,00"
  actionLabel?: string;
  actionUrl?: string;
  dismissible: boolean;
}

export interface SpendingTrend {
  categoryId: string;
  categoryName: string;
  currentAmount: number;
  previousAmount: number;
  percentChange: number;
}
