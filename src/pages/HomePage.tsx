import { useNavigate } from 'react-router-dom';
import { Header, PageContainer } from '@/components/layout';
import {
  BalanceHero,
  CardOptimizer,
  ReliefChart,
  TransactionList,
  QuickActions,
  DashboardSkeleton,
} from '@/components/features';
import { useFreeBalance, useRecentTransactions, useCreditCards } from '@/hooks';

export default function HomePage() {
  const navigate = useNavigate();
  
  // Check if any critical data is loading
  const { isLoading: balanceLoading } = useFreeBalance();
  const { isLoading: transactionsLoading } = useRecentTransactions(5);
  const { isLoading: cardsLoading } = useCreditCards();
  
  const isInitialLoad = balanceLoading && transactionsLoading && cardsLoading;

  return (
    <>
      <Header title="Finansix" showMonthSelector />
      <PageContainer className="space-y-8 pt-6">
        {isInitialLoad ? (
          <DashboardSkeleton />
        ) : (
          <>
            <BalanceHero />
            <CardOptimizer />
            <ReliefChart />
            <QuickActions />
            <TransactionList
              limit={5}
              onViewAll={() => navigate('/analysis')}
            />
          </>
        )}
      </PageContainer>
    </>
  );
}
