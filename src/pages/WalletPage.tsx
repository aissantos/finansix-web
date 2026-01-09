import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calculator, TrendingUp, Calendar, Repeat, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { CreditCardItem, AccountItem, SubscriptionItem } from '@/components/features';
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
        <div className="px-6 mb-8 max-w-md mx-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {(['accounts', 'cards', 'subscriptions'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all',
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                )}
              >
                {tab === 'cards' ? 'Cartões' : tab === 'accounts' ? 'Contas' : 'Assinaturas'}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[250px] animate-in fade-in slide-in-from-top-1 duration-300 px-4 mt-6">
          {activeTab === 'cards' && <CardsTab />}
          {activeTab === 'accounts' && <AccountsTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 px-4 pb-20 mt-6">
          {activeTab === 'cards' && (
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
          )}
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
    <section className="flex flex-col items-center justify-center text-center px-6 py-4">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">
        Saldo Total
      </p>
      <h2 className="text-slate-900 dark:text-white tracking-tight text-4xl font-extrabold">
        {formatCurrency(total)}
      </h2>
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
      {/* Hero Card - Credit Summary */}
      {usage && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 shadow-2xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Calculator className="w-40 h-40" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                Crédito Disponível
              </p>
              <h3 className="text-white text-3xl font-extrabold mt-1">
                {formatCurrency(usage.totalLimit - usage.totalUsed)}
              </h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                <span className="text-white text-sm font-bold">
                  {Math.round(usage.utilizationPercent)}% usado
                </span>
              </div>
              
              <Button 
                onClick={() => navigate('/cards/new')}
                size="sm" 
                className="bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-md rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">
          Meus Cartões
        </h2>
        <button
          onClick={() => navigate('/cards/new')}
          className="text-primary text-xs font-bold flex items-center gap-0.5 hover:underline"
        >
          VER TODOS <ArrowLeftRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {cards?.length ? (
          cards.map((card) => (
            <CreditCardItem
              key={card.id}
              card={card}
              onClick={() => navigate(`/cards/${card.id}`)}
              onEdit={() => navigate(`/cards/${card.id}/edit`)}
              onDelete={() => {
                // Will be handled by the menu in CreditCardItem
                // The actual deletion requires confirmation, which is in EditCardPage
                navigate(`/cards/${card.id}/edit`);
              }}
            />
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-slate-500 mb-4">Nenhum cartão cadastrado</p>
            <Button onClick={() => navigate('/cards/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Button>
          </Card>
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
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-2xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <ArrowLeftRight className="w-40 h-40" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              Saldo em Contas
            </p>
            <h3 className="text-white text-3xl font-extrabold mt-1">
              {formatCurrency(accounts?.reduce((sum, acc) => sum + (acc.current_balance ?? 0), 0) ?? 0)}
            </h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
              <TrendingUp className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">
                Disponível
              </span>
            </div>
            
            <Button 
              onClick={() => navigate('/accounts/new')}
              size="sm" 
              className="bg-white text-emerald-600 hover:bg-white/90 font-bold shadow-md rounded-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nova
            </Button>
          </div>
        </div>
      </div>

      {/* Transfer Button */}
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
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">
          Minhas Contas
        </h2>
        <button
          onClick={() => navigate('/accounts/new')}
          className="text-primary text-xs font-bold flex items-center gap-0.5 hover:underline"
        >
          VER TODAS <ArrowLeftRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid gap-3">
        {accounts?.length ? (
          accounts.map((acc) => (
            <AccountItem
              key={acc.id}
              account={acc}
              onEdit={() => navigate(`/accounts/${acc.id}/edit`)}
              onDelete={() => navigate(`/accounts/${acc.id}/edit`)}
            />
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-slate-500 mb-4">Nenhuma conta cadastrada</p>
            <Button onClick={() => navigate('/accounts/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Conta
            </Button>
          </Card>
        )}
      </div>
    </section>
  );
}

function SubscriptionsTab() {
  const navigate = useNavigate();
  const { data: subscriptions, isLoading } = useSubscriptions();
  const { data: cards } = useCreditCards();

  const activeSubscriptions = subscriptions?.filter(s => s.is_active) ?? [];
  const totalMonthly = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-20 w-full rounded-3xl" />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 shadow-2xl shadow-violet-500/20">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
          <Repeat className="w-40 h-40" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-6">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              Total Mensal
            </p>
            <h3 className="text-white text-3xl font-extrabold mt-1">
              {formatCurrency(totalMonthly)}
            </h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {activeSubscriptions.slice(0, 3).map((sub) => (
                <div 
                  key={sub.id}
                  className="w-8 h-8 rounded-full border-2 border-violet-600 bg-white/20 flex items-center justify-center backdrop-blur-md"
                >
                  <span className="text-white text-xs">
                    {sub.icon || '📦'}
                  </span>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={() => navigate('/subscriptions')}
              size="sm" 
              className="bg-white text-violet-600 hover:bg-white/90 font-bold shadow-md rounded-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nova
            </Button>
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">
          Minhas Assinaturas
        </h2>
        <button
          onClick={() => navigate('/subscriptions')}
          className="text-primary text-xs font-bold flex items-center gap-0.5 hover:underline"
        >
          VER TODAS <ArrowLeftRight className="w-3 h-3" />
        </button>
      </div>

      {activeSubscriptions.length === 0 ? (
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
      ) : (
        <div className="grid gap-3">
          {activeSubscriptions.slice(0, 5).map((sub) => {
            const card = cards?.find(c => c.id === sub.credit_card_id);

            return (
              <SubscriptionItem
                key={sub.id}
                subscription={sub}
                card={card}
                onEdit={() => navigate(`/subscriptions/${sub.id}/edit`)}
                onDelete={() => navigate(`/subscriptions/${sub.id}/edit`)}
              />
            );
          })}
          
          {activeSubscriptions.length > 5 && (
            <button
              onClick={() => navigate('/subscriptions')}
              className="text-center text-xs font-bold text-primary py-2 hover:underline"
            >
              Ver todas as {activeSubscriptions.length} assinaturas →
            </button>
          )}
        </div>
      )}
    </section>
  );
}