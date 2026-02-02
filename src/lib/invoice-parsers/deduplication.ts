import type { ParsedTransaction } from './index';

// We need a subset of the full Transaction type for comparison
export interface ExistingTransaction {
  id: string;
  amount: number;
  transaction_date: string;
  description: string;
}

export interface MatchScore {
  importedIndex: number;
  existingId: string;
  score: number; // 0-100
  matchType: 'exact' | 'high_confidence' | 'likely' | 'possible';
}

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  const row0 = Array.from({ length: a.length + 1 }, (_, i) => i);
  matrix[0] = row0;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates similarity score (0-1) between two strings
 */
export function similarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - levenshteinDistance(a.toLowerCase(), b.toLowerCase()) / maxLength;
}

/**
 * Finds duplicates between imported list and existing transactions
 * @param imported List of transactions parsed from invoice
 * @param existing List of existing transactions from DB for the period
 * @param threshold Score threshold (0-100) to consider a match
 */
export function findDuplicates(
  imported: ParsedTransaction[],
  existing: ExistingTransaction[],
  threshold = 80
): MatchScore[] {
  const matches: MatchScore[] = [];

  imported.forEach((imp, index) => {
    let bestMatch: MatchScore | null = null;
    let maxScore = 0;

    for (const ex of existing) {
      if (!imp.date) continue;

      let currentScore = 0;

      // 1. Amount Check (Critical) - 40 points
      // Allow small float diff
      const amountDiff = Math.abs(imp.amount - ex.amount);
      if (amountDiff < 0.05) {
        currentScore += 40;
      } else {
        // If amount differs significantly, it's likely not the same transaction
        // unless it's a partial payment, but for deduplication we assume 1:1 match usually
        continue; 
      }

      // 2. Date Check - 30 points
      // Exact date match
      if (imp.date === ex.transaction_date) {
        currentScore += 30;
      } else {
        // Allow +- 2 days margin for processing time variance
        const dateA = new Date(imp.date);
        const dateB = new Date(ex.transaction_date);
        const dayDiff = Math.abs((dateA.getTime() - dateB.getTime()) / (1000 * 3600 * 24));
        
        if (dayDiff <= 2) {
            currentScore += 20; // Slightly less for close date
        }
      }

      // 3. Description Similarity - 30 points
      // Normalize descriptions
      const descA = imp.description.replace(/\s+/g, ' ').trim();
      const descB = ex.description.replace(/\s+/g, ' ').trim();
      const sim = similarity(descA, descB);
      
      currentScore += Math.round(sim * 30);

      if (currentScore >= threshold && currentScore > maxScore) {
        maxScore = currentScore;
        
        // Determine match type
        let type: MatchScore['matchType'] = 'possible';
        if (maxScore === 100) type = 'exact';
        else if (maxScore >= 90) type = 'high_confidence';
        else if (maxScore >= 80) type = 'likely';

        bestMatch = {
          importedIndex: index,
          existingId: ex.id,
          score: maxScore,
          matchType: type
        };
      }
    }

    if (bestMatch) {
      matches.push(bestMatch);
    }
  });

  return matches;
}
