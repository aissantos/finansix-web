import { Skeleton } from '@/components/ui/skeleton';

/**
 * Feature-specific skeleton loading states
 * Use these in place of actual components during loading
 */

export function BalanceHeroSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-6 text-white">
      <div className="flex flex-col items-center">
        <Skeleton className="h-4 w-24 bg-white/20 mb-2" />
        <Skeleton className="h-10 w-40 bg-white/20 mb-1" />
        <Skeleton className="h-3 w-32 bg-white/20 mb-6" />
        
        <div className="w-full flex justify-between gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-white/10 rounded-2xl p-3">
              <Skeleton className="h-3 w-12 bg-white/20 mb-2" />
              <Skeleton className="h-5 w-20 bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl"
        >
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardOptimizerSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-24 rounded-lg" />
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ReliefChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="h-48 flex items-end justify-around gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton 
              className="w-full rounded-t-lg"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreditCardSkeleton() {
  return (
    <div className="w-full h-44 rounded-2xl p-5 bg-slate-200 dark:bg-slate-700">
      <div className="flex justify-between items-start mb-8">
        <Skeleton className="h-5 w-24 bg-slate-300 dark:bg-slate-600" />
        <Skeleton className="h-6 w-6 rounded bg-slate-300 dark:bg-slate-600" />
      </div>
      <Skeleton className="h-5 w-36 bg-slate-300 dark:bg-slate-600 mb-6" />
      <div className="flex justify-between items-end">
        <div>
          <Skeleton className="h-3 w-16 bg-slate-300 dark:bg-slate-600 mb-2" />
          <Skeleton className="h-4 w-24 bg-slate-300 dark:bg-slate-600" />
        </div>
        <Skeleton className="h-8 w-12 bg-slate-300 dark:bg-slate-600 rounded" />
      </div>
    </div>
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <BalanceHeroSkeleton />
      <CardOptimizerSkeleton />
      <ReliefChartSkeleton />
      <TransactionListSkeleton count={3} />
    </div>
  );
}
