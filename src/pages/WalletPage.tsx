import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calculator, TrendingUp, ArrowLeftRight, Repeat } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { CreditCardItem, AccountCard, SubscriptionCard } from '@/components/features';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCreditCards, useCreditUsage, useAccounts, useTotalBalance, useSubscriptions } from '@/hooks';
import { formatCurrency, cn } from '@/lib/utils';

type TabType = 'cards' | 'accounts' | 'subscriptions';

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<TabType>('cards');
  const navigate = useNavigate();

  return (
    <>
      <Header title="Carteira" />
      <PageContainer noPadding className="pt-6">
        {/* Consolidated Balance */}
        <ConsolidatedBalance />

        {/* Tabs */}
        <div className="mx-4 mt-6 bg-slate-200/70 dark:bg-slate-800 p-1.5 rounded-2xl flex shadow-inner border border-slate-100 dark:border-slate-700">
          {(['accounts', 'cards', 'subscriptions'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200',
                activeTab === tab
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-600'
              )}
            >
              {tab === 'cards' ? 'Cartões' : tab === 'accounts' ? 'Contas' : 'Assinaturas'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[250px] animate-in fade-in slide-in-from-top-1 duration-300 px-4 mt-6 pb-24">
          {activeTab === 'cards' && <CardsTab />}
          {activeTab === 'accounts' && <AccountsTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
        </div>
      </PageContainer>
    </>
  );
}

function ConsolidatedBalance() {
  const { data: totalBalance, isLoading: balanceLoading } = useTotalBalance();
  const { data: creditUsage, isLoading: creditLoading } = useCreditUsage();

  const isLoading = balanceLoading || creditLoading;
  const total = (totalBalance ?? 0) + (creditUsage?.totalLimit ?? 0) - (creditUsage?.totalUsed ?? 0);

  if (isLoading) {
    return (
      <section className="flex flex-col items-center justify-center text-center px-4">
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center text-center px-4">
      <p className="text-slate-500 text-sm font-medium mb-1 tracking-tight">
        Saldo Total Consolidado
      </p>
      <div className="flex items-baseline gap-1">
        <span className="text-slate-400 text-2xl font-semibold">R$</span>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {formatCurrency(total).replace('R$', '').trim()}
        </h1>
      </div>
      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold mt-3 border border-green-200 dark:border-green-800/30">
        <TrendingUp className="h-3.5 w-3.5" />
        Atualizado agora
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
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
       {/* Actions Buttons Container */}
       <div className="space-y-3">
          <button
              onClick={() => navigate('/simulator')}
              className="w-full text-left bg-gradient-to-r from-teal-400 to-blue-600 p-[1px] rounded-3xl group transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <div className="bg-white dark:bg-slate-800 rounded-[23px] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-sm">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                      Simulador de Impacto
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 tracking-tight">
                      Veja como novas compras afetam seu caixa
                    </p>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1">
                  →
                </span>
              </div>
            </button>
       </div>

      {/* Credit Summary */}
      {usage && (
        <div className="list-card bg-primary/5 dark:bg-primary/10 border-primary/10 dark:border-primary/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="label-overline text-primary dark:text-blue-400 mb-1">
                Limite Consolidado
              </h3>
              <p className="value-display-lg">
                {formatCurrency(usage.totalLimit)}
              </p>
            </div>
            <div className="text-right">
              <h3 className="label-overline text-expense mb-1">
                Total Faturas
              </h3>
              <p className="value-display">
                {formatCurrency(usage.totalUsed)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(usage.utilizationPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between label-overline">
              <span>Utilização de Crédito</span>
              <span>{Math.round(usage.utilizationPercent)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Cards List Grid */}
      <div className="flex justify-between items-end mb-1 px-1">
        <h3 className="section-title">Meus Cartões</h3>
        <button
          onClick={() => navigate('/cards/new')}
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          + Adicionar novo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards?.length ? (
          cards.map((card) => (
            <CreditCardItem
              key={card.id}
              card={card}
              onClick={() => navigate(`/cards/${card.id}/edit`)}
              onEdit={() => navigate(`/cards/${card.id}/edit`)}
              onDelete={() => navigate(`/cards/${card.id}/edit`)}
            />
          ))
        ) : (
          <div className="col-span-full">
            <Card className="p-8 text-center">
                <p className="text-slate-500 mb-4">Nenhum cartão cadastrado</p>
                <Button onClick={() => navigate('/cards/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cartão
                </Button>
            </Card>
          </div>
        )}
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
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Transfer Button - Mantido no topo como destaque */}
      {accounts && accounts.length >= 2 && (
        <button
          onClick={() => navigate('/transfer')}
          className="w-full text-left bg-gradient-to-r from-emerald-400 to-teal-500 p-[1px] rounded-2xl group transition-all hover:shadow-lg active:scale-[0.99]"
        >
          <div className="bg-white dark:bg-slate-800 rounded-[15px] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Transferir entre contas
                </h4>
                <p className="text-xs text-slate-500">
                  Mova dinheiro rapidamente
                </p>
              </div>
            </div>
            <span className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1">
              →
            </span>
          </div>
        </button>
      )}

      <div className="flex justify-between items-end mb-1 px-1">
        <h3 className="section-title">Minhas Contas</h3>
        <button
          onClick={() => navigate('/accounts/new')}
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          + Adicionar nova
        </button>
      </div>

      {/* Grid Layout Padronizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts?.length ? (
          accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onClick={() => navigate(`/accounts/${acc.id}/edit`)}
              onEdit={() => navigate(`/accounts/${acc.id}/edit`)}
              onTransfer={() => navigate('/transfer')}
            />
          ))
        ) : (
          <div className="col-span-full">
             <Card className="p-8 text-center">
                <p className="text-slate-500 mb-4">Nenhuma conta cadastrada</p>
                <Button onClick={() => navigate('/accounts/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Conta
                </Button>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}

function SubscriptionsTab() {
  const navigate = useNavigate();
  const { data: subscriptions, isLoading, deleteSubscription, toggleSubscription } = useSubscriptions();
  const { data: cards } = useCreditCards();

  const activeSubscriptions = subscriptions?.filter(s => s.is_active) ?? [];
  const totalMonthly = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Total Banner - Mantido pois é útil */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/70 text-xs font-medium mb-1">Total Mensal em Assinaturas</p>
            <p className="text-3xl font-black tracking-tight">{formatCurrency(totalMonthly)}</p>
          </div>
          <Button
            onClick={() => navigate('/subscriptions')}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-end mb-1 px-1">
        <h3 className="section-title">Assinaturas Ativas</h3>
        <button
          onClick={() => navigate('/subscriptions')}
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          Ver todas →
        </button>
      </div>

      {/* Grid Layout Padronizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subscriptions?.length ? (
          subscriptions.map((sub) => {
            const card = cards?.find(c => c.id === sub.credit_card_id);
            return (
              <SubscriptionCard
                key={sub.id}
                subscription={sub}
                cardName={card?.name}
                onClick={() => navigate('/subscriptions')} // Idealmente levaria para edição
                onEdit={() => navigate('/subscriptions')}
                onDelete={() => deleteSubscription.mutate(sub.id)}
                onToggleActive={() => toggleSubscription.mutate({ id: sub.id, isActive: !sub.is_active })}
              />
            );
          })
        ) : (
          <div className="col-span-full">
            <Card className="p-8 text-center">
                <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                    <Repeat className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm mb-3">Nenhuma assinatura cadastrada</p>
                <Button onClick={() => navigate('/subscriptions')} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar primeira
                </Button>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}