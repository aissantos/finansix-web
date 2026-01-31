import { useMemo } from 'react';
import type { TransactionWithDetails } from '@/types';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

interface UseFilteredTransactionsProps {
  transactions: TransactionWithDetails[] | undefined;
  searchQuery: string;
  filterType: FilterType;
  selectedCategoryId: string | null;
  dateRange: { start: string | null; end: string | null };
}

export function useFilteredTransactions({
  transactions,
  searchQuery,
  filterType,
  selectedCategoryId,
  dateRange
}: UseFilteredTransactionsProps) {
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    let filtered = [...transactions];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.category?.name.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(t => t.category_id === selectedCategoryId);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(t => 
        new Date(t.transaction_date) >= new Date(dateRange.start!)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => 
        new Date(t.transaction_date) <= new Date(dateRange.end!)
      );
    }

    return filtered;
  }, [transactions, searchQuery, filterType, selectedCategoryId, dateRange]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  return { filteredTransactions, totals };
}
