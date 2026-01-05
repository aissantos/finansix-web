import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calculator, ClipboardCheck, TrendingUp } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { CreditCardItem } from '@/components/features';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCreditCards, useCreditUsage, useAccounts, useTotalBalance } from '@/hooks';
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
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Credit Summary */}
      {usage && (
        <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 border border-primary/10 dark:border-primary/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xs font-black text-primary dark:text-blue-400 uppercase tracking-widest mb-1">
                Limite Consolidado
              </h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(usage.totalLimit)}
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-black text-expense uppercase tracking-widest mb-1">
                Total Faturas
              </h3>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {formatCurrency(usage.totalUsed)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(19,91,236,0.3)]"
                style={{ width: `${Math.min(usage.utilizationPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              <span>Utilização de Crédito</span>
              <span>{Math.round(usage.utilizationPercent)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Cards List */}
      <div className="flex justify-between items-end mb-1 px-1">
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Meus Cartões
        </h3>
        <button
          onClick={() => navigate('/cards/new')}
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          + Adicionar novo
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {cards?.length ? (
          cards.map((card) => (
            <CreditCardItem
              key={card.id}
              card={card}
              onClick={() => navigate(`/cards/${card.id}`)}
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
    <section className="space-y-4">
      <div className="flex justify-between items-end mb-1 px-1">
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Minhas Contas
        </h3>
        <button
          onClick={() => navigate('/accounts/new')}
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          + Adicionar nova
        </button>
      </div>

      <div className="grid gap-3">
        {accounts?.length ? (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-all hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: acc.color || '#6366f1' }}
                >
                  {acc.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                    {acc.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium capitalize">
                    {acc.type === 'checking' ? 'Conta Corrente' : acc.type === 'savings' ? 'Poupança' : acc.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Saldo
                </span>
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrency(acc.current_balance)}
                </p>
              </div>
            </div>
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
  // Mock subscriptions for now
  const subscriptions = [
    { name: 'Netflix Premium', price: 55.90, card: 'Nubank ••8832', date: 'Vence em 2 dias', icon: '🎬', warning: true },
    { name: 'Spotify Duo', price: 21.90, card: 'Nubank ••8832', date: 'Próx: 20 Jan', icon: '🎵' },
    { name: 'Smart Fit Black', price: 119.90, card: 'Visa ••4002', date: 'Próx: 01 Fev', icon: '💪' },
  ];

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.price, 0);

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-end mb-1 px-1">
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Assinaturas Ativas
        </h3>
        <div className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-[10px] font-bold text-primary uppercase">
            {formatCurrency(totalMonthly)}/mês
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {subscriptions.map((sub, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4 transition-all hover:shadow-md active:scale-[0.99]"
          >
            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl relative flex-shrink-0">
              {sub.icon}
              {sub.warning && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sub.name}</h4>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {formatCurrency(sub.price)}
                </p>
              </div>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{sub.card}</p>
              <div className="flex items-center justify-between mt-2">
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    sub.warning
                      ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
                      : 'bg-slate-50 text-slate-500 dark:bg-slate-700'
                  )}
                >
                  {sub.date}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
