import { Category, TransactionWithDetails } from '@/types';

interface Prediction {
  categoryId?: string;
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
}

// Common keywords mapping for Brazil
const KEYWORD_MAP: Record<string, string[]> = {
  // Brand name -> Common Category Keywords (we map to generic keys, then try to find category by name)
  'uber': ['transporte', 'uber', 'taxi', 'ride'],
  '99': ['transporte', '99', 'taxi'],
  'ifood': ['alimentação', 'delivery', 'restaurante', 'lanche', 'jantar'],
  'amazon': ['compras', 'shopping', 'eletrônicos'],
  'netflix': ['assinaturas', 'streaming', 'lazer', 'entretenimento'],
  'spotify': ['assinaturas', 'streaming', 'lazer', 'música'],
  'apple': ['serviços', 'eletrônicos', 'assinaturas'],
  'google': ['serviços', 'assinaturas'],
  'supermercado': ['mercado', 'alimentação', 'compras'],
  'mercado': ['mercado', 'alimentação', 'compras'],
  'padaria': ['padaria', 'alimentação', 'café'],
  'farmacia': ['saúde', 'farmácia', 'drogaria', 'medicamentos'],
  'drogaria': ['saúde', 'farmácia', 'drogaria', 'medicamentos'],
  'posto': ['transporte', 'combustível', 'gasolina', 'abastecimento'],
  'shell': ['transporte', 'combustível', 'gasolina'],
  'ipiranga': ['transporte', 'combustível', 'gasolina'],
};

export function predictCategory(
  description: string,
  categories: Category[],
  recentTransactions: TransactionWithDetails[]
): Prediction {
  const normalizedDesc = description.toLowerCase().trim();

  // 1. Check history (Highest confidence)
  // Look for exact matches or very similar descriptions in history
  const historyMatch = findInHistory(normalizedDesc, recentTransactions);
  if (historyMatch) {
    return {
      categoryId: historyMatch,
      confidence: 'high',
      reason: 'Baseado no seu histórico'
    };
  }

  // 2. Check Keyword Mapping (Medium confidence)
  // Try to find a category that matches keywords for known brands in description
  const keywordMatch = findByKeywords(normalizedDesc, categories);
  if (keywordMatch) {
    return {
      categoryId: keywordMatch.id,
      confidence: 'medium',
      reason: `Sugerido por "${keywordMatch.name}"`
    };
  }

  // 3. Fallback: Try to find category name inside description (e.g. "Restaurante X")
  const nameMatch = categories.find(c => normalizedDesc.includes(c.name.toLowerCase()));
  if (nameMatch) {
    return {
      categoryId: nameMatch.id,
      confidence: 'low',
      reason: 'Semelhança com nome da categoria'
    };
  }

  return {
    confidence: 'low'
  };
}

function findInHistory(description: string, transactions: TransactionWithDetails[]): string | undefined {
  // Filter transactions that have a category
  const validTx = transactions.filter(t => t.category_id && t.description);

  // Exact match
  const exact = validTx.find(t => t.description.toLowerCase() === description);
  if (exact?.category_id) return exact.category_id;

  // Contains match (if description is long enough)
  if (description.length > 4) {
    const contains = validTx.find(t => 
      t.description.toLowerCase().includes(description) || 
      description.includes(t.description.toLowerCase())
    );
    if (contains?.category_id) return contains.category_id;
  }
  
  return undefined;
}

function findByKeywords(description: string, categories: Category[]): Category | undefined {
  for (const [key, similarWords] of Object.entries(KEYWORD_MAP)) {
    if (description.includes(key)) {
      // Found a brand keyword. Now find a matching category.
      // We look for a category that contains any of the "similarWords"
      const match = categories.find(c => {
         const catName = c.name.toLowerCase();
         return similarWords.some(w => catName.includes(w));
      });
      if (match) return match;
    }
  }
  return undefined;
}
