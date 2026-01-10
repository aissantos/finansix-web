/**
 * Smart Category Suggestion Helper
 * Uses ML-like pattern matching to suggest categories based on description
 */

interface CategoryPattern {
  keywords: string[];
  categoryName: string;
  priority: number;
}

// Pattern database for category suggestions
const CATEGORY_PATTERNS: CategoryPattern[] = [
  // Transport
  {
    keywords: ['uber', 'taxi', 'cabify', '99', 'lyft', 'ônibus', 'onibus', 'metro', 'metrô', 'combustível', 'combustivel', 'gasolina', 'etanol', 'diesel', 'estacionamento'],
    categoryName: 'Transporte',
    priority: 10,
  },
  
  // Food
  {
    keywords: ['ifood', 'rappi', 'uber eats', 'restaurante', 'lanchonete', 'padaria', 'mercado', 'supermercado', 'açougue', 'acougue', 'feira', 'hortifruti', 'pizza', 'hamburguer', 'comida'],
    categoryName: 'Alimentação',
    priority: 10,
  },
  
  // Entertainment
  {
    keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'apple music', 'youtube', 'cinema', 'teatro', 'show', 'ingresso', 'game', 'jogo', 'streaming'],
    categoryName: 'Lazer',
    priority: 9,
  },
  
  // Health
  {
    keywords: ['farmácia', 'farmacia', 'drogaria', 'droga raia', 'pague menos', 'médico', 'medico', 'dentista', 'hospital', 'clínica', 'clinica', 'exame', 'laboratório', 'laboratorio', 'remédio', 'remedio'],
    categoryName: 'Saúde',
    priority: 10,
  },
  
  // Shopping
  {
    keywords: ['amazon', 'mercado livre', 'shopee', 'aliexpress', 'loja', 'shopping', 'roupa', 'sapato', 'tênis', 'tenis', 'eletronico', 'eletrônico'],
    categoryName: 'Compras',
    priority: 8,
  },
  
  // Bills
  {
    keywords: ['luz', 'água', 'agua', 'internet', 'telefone', 'celular', 'conta', 'fatura', 'boleto', 'iptu', 'condomínio', 'condominio', 'aluguel'],
    categoryName: 'Contas',
    priority: 9,
  },
  
  // Education
  {
    keywords: ['curso', 'faculdade', 'universidade', 'escola', 'colégio', 'colegio', 'livro', 'material escolar', 'mensalidade'],
    categoryName: 'Educação',
    priority: 8,
  },
  
  // Income
  {
    keywords: ['salário', 'salario', 'pagamento', 'freelance', 'freela', 'bônus', 'bonus', 'pix recebido', 'transferência recebida', 'transferencia recebida'],
    categoryName: 'Salário',
    priority: 10,
  },
];

/**
 * Suggests a category based on the transaction description
 * @param description - Transaction description
 * @param previousCategories - User's most used categories (for personalization)
 * @returns Suggested category name or null
 */
export function suggestCategory(
  description: string,
  previousCategories?: { name: string; count: number }[]
): string | null {
  if (!description || description.length < 3) return null;

  const normalizedDescription = description.toLowerCase().trim();
  
  // Find matching patterns
  const matches = CATEGORY_PATTERNS.map(pattern => {
    const matchCount = pattern.keywords.filter(keyword =>
      normalizedDescription.includes(keyword.toLowerCase())
    ).length;
    
    return {
      categoryName: pattern.categoryName,
      score: matchCount * pattern.priority,
    };
  }).filter(match => match.score > 0);

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  // Return best match if confident enough
  if (matches.length > 0 && matches[0].score >= 8) {
    return matches[0].categoryName;
  }

  // Fallback: Return most used category by user
  if (previousCategories && previousCategories.length > 0) {
    return previousCategories[0].name;
  }

  return null;
}

/**
 * Suggests transaction type based on description
 * @param description - Transaction description
 * @returns 'income' | 'expense' | null
 */
export function suggestTransactionType(description: string): 'income' | 'expense' | null {
  if (!description) return null;

  const normalizedDescription = description.toLowerCase();
  
  // Income keywords
  const incomeKeywords = [
    'salário', 'salario', 'pagamento', 'freelance', 'freela', 'bônus', 'bonus',
    'pix recebido', 'transferência recebida', 'transferencia recebida',
    'depósito', 'deposito', 'venda', 'comissão', 'comissao'
  ];

  if (incomeKeywords.some(keyword => normalizedDescription.includes(keyword))) {
    return 'income';
  }

  // Default to expense (most common)
  return 'expense';
}

/**
 * Suggests if transaction should be installment based on description and amount
 * @param description - Transaction description
 * @param amount - Transaction amount
 * @returns Suggested installment count or null
 */
export function suggestInstallments(
  description: string,
  amount: number
): number | null {
  if (!description || amount < 200) return null;

  const normalizedDescription = description.toLowerCase();
  
  // Keywords that suggest installment purchases
  const installmentKeywords = [
    'celular', 'notebook', 'computador', 'tv', 'geladeira', 'fogão', 'fogao',
    'máquina', 'maquina', 'móvel', 'movel', 'sofá', 'sofa', 'cama', 'colchão', 'colchao'
  ];

  const hasInstallmentKeyword = installmentKeywords.some(keyword =>
    normalizedDescription.includes(keyword)
  );

  if (hasInstallmentKeyword) {
    // Suggest installments based on amount
    if (amount >= 3000) return 12;
    if (amount >= 1500) return 6;
    if (amount >= 500) return 3;
  }

  return null;
}

/**
 * Gets user's category usage statistics
 * @param transactions - User's past transactions
 * @returns Array of categories with usage count
 */
export function getCategoryStats(
  transactions: Array<{ category: { name: string } }>
): { name: string; count: number }[] {
  const categoryMap = new Map<string, number>();

  transactions.forEach(tx => {
    if (tx.category?.name) {
      const count = categoryMap.get(tx.category.name) || 0;
      categoryMap.set(tx.category.name, count + 1);
    }
  });

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
