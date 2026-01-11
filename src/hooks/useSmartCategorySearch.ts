import { useMemo } from 'react';
import { useCategories } from './useCategories';
import { useRecentTransactions } from './useTransactions';
import type { Category } from '@/types';

interface CategoryScore extends Category {
  score: number;
  reason: string;
}

/**
 * Smart category search with AI-like suggestions
 * Scores based on:
 * 1. Text match quality
 * 2. Usage frequency
 * 3. Context (time of day, typical amount range)
 * 4. Recent usage patterns
 */
export function useSmartCategorySearch(query: string, transactionAmount?: number) {
  const { data: categories = [] } = useCategories();
  const { data: recentTransactions = [] } = useRecentTransactions(50);

  return useMemo(() => {
    if (!query.trim()) {
      // No query - return by usage frequency
      return sortByUsageFrequency(categories, recentTransactions);
    }

    const normalizedQuery = query.toLowerCase().trim();
    const scoredCategories: CategoryScore[] = [];

    for (const category of categories) {
      let score = 0;
      let reason = '';

      // 1. Text Match Score (0-100)
      const nameMatch = calculateTextMatch(category.name, normalizedQuery);
      if (nameMatch > 0) {
        score += nameMatch * 0.4; // 40% weight
        reason = nameMatch > 80 ? 'Correspondência exata' : 'Correspondência parcial';
      } else {
        continue; // Skip if no text match at all
      }

      // 2. Usage Frequency Score (0-100)
      const usageScore = calculateUsageFrequency(category, recentTransactions);
      score += usageScore * 0.3; // 30% weight
      if (usageScore > 50) {
        reason += reason ? ' • Usada frequentemente' : 'Usada frequentemente';
      }

      // 3. Time Context Score (0-100)
      const timeScore = calculateTimeContext(category, recentTransactions);
      score += timeScore * 0.15; // 15% weight
      if (timeScore > 70) {
        reason += reason ? ' • Comum neste horário' : 'Comum neste horário';
      }

      // 4. Amount Context Score (0-100)
      if (transactionAmount) {
        const amountScore = calculateAmountContext(category, transactionAmount, recentTransactions);
        score += amountScore * 0.15; // 15% weight
        if (amountScore > 70) {
          reason += reason ? ' • Valor típico' : 'Valor típico';
        }
      }

      scoredCategories.push({
        ...category,
        score: Math.round(score),
        reason: reason || 'Categoria disponível',
      });
    }

    // Sort by score descending
    return scoredCategories.sort((a, b) => b.score - a.score);
  }, [query, categories, recentTransactions, transactionAmount]);
}

/**
 * Calculate text match quality using fuzzy matching
 */
function calculateTextMatch(text: string, query: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  // Exact match
  if (normalizedText === normalizedQuery) return 100;

  // Starts with
  if (normalizedText.startsWith(normalizedQuery)) return 90;

  // Contains
  if (normalizedText.includes(normalizedQuery)) return 70;

  // Fuzzy match (Levenshtein-like)
  const distance = levenshteinDistance(normalizedText, normalizedQuery);
  const maxLength = Math.max(normalizedText.length, normalizedQuery.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return similarity > 50 ? similarity : 0;
}

/**
 * Calculate usage frequency in recent transactions
 */
function calculateUsageFrequency(category: Category, recentTransactions: any[]): number {
  const usageCount = recentTransactions.filter(
    (tx) => tx.category_id === category.id
  ).length;

  // Normalize to 0-100
  const maxUsage = 20; // Assume max 20 uses in recent history is 100%
  return Math.min((usageCount / maxUsage) * 100, 100);
}

/**
 * Calculate if category is commonly used at this time of day
 */
function calculateTimeContext(category: Category, recentTransactions: any[]): number {
  const currentHour = new Date().getHours();
  
  const categoryTransactions = recentTransactions.filter(
    (tx) => tx.category_id === category.id
  );

  if (categoryTransactions.length === 0) return 0;

  // Count transactions in similar time window (±2 hours)
  const timeWindowCount = categoryTransactions.filter((tx) => {
    const txHour = new Date(tx.transaction_date).getHours();
    return Math.abs(txHour - currentHour) <= 2;
  }).length;

  // Normalize
  return (timeWindowCount / categoryTransactions.length) * 100;
}

/**
 * Calculate if amount is typical for this category
 */
function calculateAmountContext(
  category: Category,
  amount: number,
  recentTransactions: any[]
): number {
  const categoryTransactions = recentTransactions.filter(
    (tx) => tx.category_id === category.id
  );

  if (categoryTransactions.length === 0) return 50; // Neutral score

  // Calculate average amount for this category
  const amounts = categoryTransactions.map((tx) => tx.amount);
  const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const stdDev = calculateStdDev(amounts, avgAmount);

  // Check if current amount is within 1 standard deviation
  const distance = Math.abs(amount - avgAmount);
  
  if (distance <= stdDev) return 100; // Very typical
  if (distance <= stdDev * 2) return 70; // Somewhat typical
  return 30; // Atypical but possible
}

/**
 * Sort categories by usage frequency when no query
 */
function sortByUsageFrequency(categories: Category[], recentTransactions: any[]): CategoryScore[] {
  return categories
    .map((category) => ({
      ...category,
      score: calculateUsageFrequency(category, recentTransactions),
      reason: 'Ordenado por uso',
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate standard deviation
 */
function calculateStdDev(values: number[], mean: number): number {
  const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}
