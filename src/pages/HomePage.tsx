import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Repeat, ChevronRight } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import {
  BalanceHero,
  CardOptimizer,
  ReliefChart,
  TransactionList,
  DashboardSkeleton,
  OnboardingTour,
  PaymentSummaryCards,
  InsightsCard
} from '@/components/features';
import { Card } from '@/components/ui/card';
import { DeleteConfirmDialog } from '@/components/ui';
import { EditTransactionModal } from '@/components/modals/EditTransactionModal';
import { 
  useFreeBalance, 
  useRecentTransactions, 
  useCreditCards, 
  useSubscriptionTotal, 
  useDeleteTransaction,
  useTransactions,
  useCategories
} from '@/hooks';
import { useSelectedMonth } from '@/stores';
import { InsightService } from '@/lib/services/InsightService';
import { formatCurrency } from '@/lib/utils';
import { subMonths } from 'date-fns';
import { toast } from '@/hooks/useToast';
import type { TransactionWithDetails } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const deleteMutation = useDeleteTransaction();
  
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithDetails | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithDetails | null>(null);
  
  // Check if any critical data is loading
  const { isLoading: balanceLoading } = useFreeBalance();
  const { isLoading: transactionsLoading } = useRecentTransactions(5);
  const { isLoading: cardsLoading } = useCreditCards();
  
  const isInitialLoad = balanceLoading && transactionsLoading && cardsLoading;

  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteMutation.mutateAsync(deletingTransaction.id);
      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso',
        variant: 'success',
      });
      setDeletingTransaction(null);
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Header title="Finansix" showMonthSelector />
      <PageContainer className="space-y-6 pt-6">
        {isInitialLoad ? (
          <DashboardSkeleton />
        ) : (
          <>
            <BalanceHero />
            
            {/* NEW v2.0: Smart Insights - Context-aware tips */}
            <HomeSmartInsights />
            
            <PaymentSummaryCards />
            <CardOptimizer />
            <SubscriptionsSummary />
            <ReliefChart />
            
            {/* v2.0: Now with swipe gestures! */}
            <TransactionList
              limit={5}
              onViewAll={() => navigate('/transactions')}
              onEdit={setEditingTransaction}
              onDelete={setDeletingTransaction}
              enableSwipeGestures={true}
            />
          </>
        )}
      </PageContainer>

      {/* Modals */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      <DeleteConfirmDialog
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDeleteConfirm}
        entityName="esta transação"
        isLoading={deleteMutation.isPending}
      />

      {/* Onboarding Tour */}
      <OnboardingTour />
    </>
  );
}

function HomeSmartInsights() {
  const selectedMonth = useSelectedMonth();
  const previousMonth = subMonths(selectedMonth, 1);
  
  const { data: currentTxs } = useTransactions({ month: selectedMonth });
  const { data: previousTxs } = useTransactions({ month: previousMonth });
  const { data: categories } = useCategories();

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const insights = useMemo(() => {
    if (!currentTxs || !previousTxs || !categories) return [];
    
    // 1. Trends (Spending increase > 20%)
    const trends = InsightService.analyzeTrends(currentTxs, previousTxs, categories);
    
    // 2. Outliers (Single large transactions)
    const outliers = InsightService.detectOutliers(currentTxs);
    
    // 3. Subscriptions (Simple check on current + previous month)
    // Note: Better detection usually requires 3+ months, but we check what we have
    const potentialSubs = InsightService.detectSubscriptions([...previousTxs, ...currentTxs]);

    return [...trends, ...outliers, ...potentialSubs].filter(i => !dismissedIds.includes(i.id));
  }, [currentTxs, previousTxs, categories, dismissedIds]);

  if (insights.length === 0) return null;

  return <InsightsCard insights={insights} onDismiss={id => setDismissedIds(prev => [...prev, id])} />;
}

function SubscriptionsSummary() {
  const navigate = useNavigate();
  const { total, count } = useSubscriptionTotal();

  if (count === 0) return null;

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
      onClick={() => navigate('/subscriptions')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Repeat className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Assinaturas Ativas</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatCurrency(total)}
              </span>
              <span className="text-xs text-slate-400">/mês</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
            {count} {count === 1 ? 'assinatura' : 'assinaturas'}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </Card>
  );
}
