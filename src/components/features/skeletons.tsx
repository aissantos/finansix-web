import { Skeleton } from '@/components/ui/skeleton';

// Feature-specific skeleton loading states

export function BalanceHeroSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl bg-white/20" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 bg-white/20" />
            <Skeleton className="h-7 w-36 bg-white/30" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full bg-white/20" />
      </div>
      
      <Skeleton className="h-3 w-20 bg-white/20 mb-2" />
      <Skeleton className="h-10 w-48 bg-white/30 mb-4" />
      
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/10 rounded-xl p-3">
            <Skeleton className="h-3 w-full bg-white/20 mb-2" />
            <Skeleton className="h-5 w-3/4 bg-white/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardOptimizerSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-40 rounded-xl flex-shrink-0" />
        ))}
      </div>
    </div>
  );
}

export function TransactionItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {Array.from({ length: count }).map((_, i) => (
          <TransactionItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ReliefChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-end gap-2 h-40">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20 w-20 rounded-2xl flex-shrink-0" />
      ))}
    </div>
  );
}

export function WalletCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 w-72 rounded-2xl flex-shrink-0" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

export function AccountListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

export function CreditCardListSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
      {[1, 2, 3].map((i) => (
        <div key={i} className="snap-center">
          <Skeleton className="h-48 w-80 rounded-2xl flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function AnalysisChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex items-center justify-center h-64">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Full page skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <BalanceHeroSkeleton />
      <CardOptimizerSkeleton />
      <ReliefChartSkeleton />
      <QuickActionsSkeleton />
      <TransactionListSkeleton count={5} />
    </div>
  );
}

export function WalletPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <CreditCardListSkeleton />
      <AccountListSkeleton />
    </div>
  );
}

export function AnalysisPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AnalysisChartSkeleton />
      <TransactionListSkeleton count={10} />
    </div>
  );
}
