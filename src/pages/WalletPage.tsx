import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  TrendingUp, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { CreditCardItem, AccountCard, SubscriptionCard } from '@/components/features';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCreditCards, useCreditUsage, useAccounts, useTotalBalance, useSubscriptions } from '@/hooks';
import { formatCurrency, cn } from '@/lib/utils';

type TabType = 'cards' | 'accounts' | 'subscriptions';

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<TabType>('cards');
  const navigate = useNavigate();

  return (
    <>
      <Header title="Carteira" />
      <PageContainer noPadding className="pt-6 pb-24">
        {/* Consolidated Balance Hero */}
        <ConsolidatedBalance />

        {/* Modern Segmented Control */}
        <div className="mx-4 mt-8 p-1.5 rounded-2xl bg-muted/40 border border-border/40 flex">
          {(['cards', 'accounts', 'subscriptions'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ease-out',
                activeTab === tab
                  ? 'bg-background shadow-sm text-foreground ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              {tab === 'cards' ? 'Cartões' : tab === 'accounts' ? 'Contas' : 'Assinaturas'}
            </button>
          ))}
        </div>

        {/* Content Area with Animation */}
        <div className="px-4 mt-6 min-h-[400px] animate-in fade-in slide-in-from-top-4 duration-500">
          {activeTab === 'cards' && <CardsTab />}
          {activeTab === 'accounts' && <AccountsTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
        </div>
      </PageContainer>
    </>
  );
}

// -----------------------------------------------------------------------------
// SUB-COMPONENTS
// -----------------------------------------------------------------------------

function ConsolidatedBalance() {
  const { data: totalBalance, isLoading: balanceLoading } = useTotalBalance();
  const { data: creditUsage, isLoading: creditLoading } = useCreditUsage();

  const isLoading = balanceLoading || creditLoading;
  const total = (totalBalance ?? 0) + (creditUsage?.totalLimit ?? 0) - (creditUsage?.totalUsed ?? 0);

  if (isLoading) {
    return (
      <section className="flex flex-col items-center justify-center text-center px-4 py-8">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-12 w-48 mb-4" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </section>
    );
  }

  return (
    <section className="relative flex flex-col items-center justify-center text-center px-4">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />
      
      <p className="text-muted-foreground text-sm font-medium mb-2 tracking-wide uppercase">
        Patrimônio Líquido
      </p>
      
      <div className="flex items-baseline gap-1 relative z-10">
        <span className="text-muted-foreground text-2xl font-semibold">R$</span>
        <h1 className="text-5xl font-extrabold text-foreground tracking-tighter">
          {formatCurrency(total).replace('R$', '').trim()}
        </h1>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>Atualizado em tempo real</span>
      </div>
    </section>
  );
}

function CardsTab() {
  const { data: cards, isLoading } = useCreditCards();
  const { data: usage } = useCreditUsage();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Simulator Banner */}
      <button
        onClick={() => navigate('/simulator')}
        className="w-full group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-[1px] text-left transition-all hover:shadow-xl active:scale-[0.99]"
      >
        <div className="relative flex items-center justify-between rounded-[23px] bg-background/95 backdrop-blur-xl p-5 transition-colors group-hover:bg-background/80">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Simulador de Faturas</h4>
              <p className="text-xs text-muted-foreground">Preveja o impacto de novas compras</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </button>

      {/* Credit Summary Card */}
      {usage && (
        <div className="rounded-3xl bg-card border border-border/50 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Limite Global</h3>
              <p className="text-2xl font-bold tracking-tight mt-1">{formatCurrency(usage.totalLimit)}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-medium text-red-500 uppercase tracking-wider">Em Uso</h3>
              <p className="text-2xl font-bold tracking-tight mt-1 text-red-600 dark:text-red-400">{formatCurrency(usage.totalUsed)}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  usage.utilizationPercent > 80 ? "bg-red-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(usage.utilizationPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>{Math.round(usage.utilizationPercent)}% Utilizado</span>
              <span>{formatCurrency(usage.availableLimit)} Disponível</span>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight px-1">Meus Cartões</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards?.map((card) => (
            <CreditCardItem
              key={card.id}
              card={card}
              onClick={() => navigate(`/cards/${card.id}/edit`)}
              onEdit={() => navigate(`/cards/${card.id}/edit`)}
              onDelete={() => navigate(`/cards/${card.id}/edit`)}
            />
          ))}

          {/* Ghost Card (Add New) */}
          <button
            onClick={() => navigate('/cards/new')}
            className="group flex min-h-[200px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 transition-all hover:bg-muted/10 hover:border-primary/50 hover:shadow-inner active:scale-[0.98]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted transition-transform group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary">
              <Plus className="h-7 w-7 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="mt-4 text-sm font-semibold text-muted-foreground group-hover:text-foreground">
              Adicionar Cartão
            </p>
          </button>
        </div>
      </div>
    </section>
  );
}

function AccountsTab() {
  const { data: accounts, isLoading } = useAccounts();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold tracking-tight">Contas Bancárias</h3>
        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
          {accounts?.length || 0} contas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((acc) => (
          <AccountCard
            key={acc.id}
            account={acc}
            onEdit={() => navigate(`/accounts/${acc.id}/edit`)}
            onTransfer={() => navigate('/transfer')}
          />
        ))}

        {/* Ghost Card (Add New) */}
        <button
          onClick={() => navigate('/accounts/new')}
          className="group flex min-h-[180px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 transition-all hover:bg-muted/10 hover:border-emerald-500/50 hover:shadow-inner active:scale-[0.98]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted transition-transform group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:text-emerald-500">
            <Plus className="h-7 w-7 text-muted-foreground group-hover:text-emerald-500" />
          </div>
          <p className="mt-4 text-sm font-semibold text-muted-foreground group-hover:text-foreground">
            Nova Conta
          </p>
        </button>
      </div>
    </section>
  );
}

function SubscriptionsTab() {
  const navigate = useNavigate();
  const { data: subscriptions, isLoading, deleteSubscription, toggleSubscription } = useSubscriptions();

  const activeSubscriptions = subscriptions?.filter(s => s.is_active) ?? [];
  const totalMonthly = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Monthly Total Summary */}
      <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Custo Mensal Fixo</p>
            <p className="text-3xl font-extrabold tracking-tight">{formatCurrency(totalMonthly)}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
             <Calculator className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-bold tracking-tight">Assinaturas</h3>
        <button 
            onClick={() => navigate('/subscriptions')}
            className="text-sm font-medium text-primary hover:underline"
        >
            Gerenciar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {subscriptions?.map((sub) => (
          <SubscriptionCard
            key={sub.id}
            subscription={sub}
            onClick={() => navigate('/subscriptions')}
            onEdit={() => navigate('/subscriptions')}
            onToggleActive={() => toggleSubscription.mutate({ id: sub.id, isActive: !sub.is_active })}
            onDelete={() => deleteSubscription.mutate(sub.id)}
          />
        ))}

        {/* Ghost Card (Add New) */}
        <button
          onClick={() => navigate('/subscriptions')}
          className="group flex min-h-[160px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 transition-all hover:bg-muted/10 hover:border-violet-500/50 hover:shadow-inner active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-transform group-hover:scale-110 group-hover:bg-violet-500/10 group-hover:text-violet-500">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-violet-500" />
          </div>
          <p className="mt-3 text-sm font-semibold text-muted-foreground group-hover:text-foreground">
            Nova Assinatura
          </p>
        </button>
      </div>
    </section>
  );
}