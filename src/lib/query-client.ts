import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

import { captureError } from '@/lib/sentry';
import { log } from '@/lib/logger';

// Custom error handler for global query errors
const handleQueryError = (error: unknown) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    log.error('[Query Error]', { error });
  }

  // Send to Sentry in production using standardized helper
  captureError(error, { tags: { type: 'query-error' } });
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as { statusCode: number }).statusCode;
          if (statusCode >= 400 && statusCode < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst', // Show cached data while offline
    },
    mutations: {
      retry: 3,
      networkMode: 'offlineFirst',
      onError: handleQueryError,
    },
  },
});

// Only persist in browser environment
if (typeof window !== 'undefined' && 'localStorage' in window) {
  try {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: 'finansix-query-cache',
      throttleTime: 1000, // Don't save more than once per second
      serialize: (data: unknown) => JSON.stringify(data),
      deserialize: (data: string) => JSON.parse(data),
    });

    persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      buster: '1.0.0', // Cache version - increment to invalidate old caches
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Don't persist failed queries
          if (query.state.status === 'error') {
            return false;
          }
          
          // Only persist specific queries that are safe to cache
          const persistableKeys = [
            'transactions',
            'cards',
            'accounts',
            'categories',
            'freeBalance',
            'projection',
            'installments',
          ];
          const queryKey = query.queryKey[0];
          return typeof queryKey === 'string' && persistableKeys.includes(queryKey);
        },
        // Persist paused mutations (e.g. offline) so they resume on reload
        shouldDehydrateMutation: (mutation) => {
          return mutation.state.isPaused;
        },
      },
    });
  } catch (error) {
    // localStorage might not be available in some contexts
    log.warn('Query persistence disabled', { error });
  }
}

// Query keys factory
export const queryKeys = {
  // Transactions
  transactions: {
    all: ['transactions'] as const,
    list: (householdId: string, month?: string, creditCardId?: string) =>
      ['transactions', 'list', householdId, month, creditCardId] as const,
    detail: (id: string) => ['transactions', 'detail', id] as const,
    byCategory: (householdId: string, month: string) =>
      ['transactions', 'byCategory', householdId, month] as const,
  },

  // Credit Cards
  cards: {
    all: ['cards'] as const,
    list: (householdId: string) => ['cards', 'list', householdId] as const,
    detail: (id: string) => ['cards', 'detail', id] as const,
    usage: (householdId: string) => ['cards', 'usage', householdId] as const,
  },

  // Accounts
  accounts: {
    all: ['accounts'] as const,
    list: (householdId: string) => ['accounts', 'list', householdId] as const,
    detail: (id: string) => ['accounts', 'detail', id] as const,
    totalBalance: (householdId: string) =>
      ['accounts', 'totalBalance', householdId] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    list: (householdId: string, type?: string) =>
      ['categories', 'list', householdId, type] as const,
    favorites: (householdId: string) =>
      ['categories', 'favorites', householdId] as const,
  },

  // Installments
  installments: {
    all: ['installments'] as const,
    list: (householdId: string, options?: object) =>
      ['installments', 'list', householdId, options] as const,
    projection: (householdId: string, months?: number) =>
      ['installments', 'projection', householdId, months] as const,
  },

  // Financial calculations
  freeBalance: (householdId: string, month: string) =>
    ['freeBalance', householdId, month] as const,
  bestCard: (householdId: string) => ['bestCard', householdId] as const,

  // User & Household
  user: ['user'] as const,
  household: (id: string) => ['household', id] as const,
};
