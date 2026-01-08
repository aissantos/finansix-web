import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calculator, TrendingUp, Calendar, Repeat, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { CreditCardItem } from '@/components/features';
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
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
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

      {/* Cards List */}
      <div className="flex justify-between items-end mb-1 px-1">
        <h3 className="section-title">Meus Cartões</h3>
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
    <section className="space-y-4">
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
            <button
              key={acc.id}
              onClick={() => navigate(`/accounts/${acc.id}/edit`)}
              className="w-full text-left bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-all hover:shadow-md active:scale-[0.99]"
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
                    {acc.type === 'checking' ? 'Conta Corrente' : acc.type === 'savings' ? 'Poupança' : acc.type === 'investment' ? 'Investimento' : acc.type === 'cash' ? 'Dinheiro' : acc.type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Saldo
                </span>
                <p className={cn(
                  'text-lg font-black',
                  (acc.current_balance ?? 0) < 0 ? 'text-expense' : 'text-slate-900 dark:text-white'
                )}>
                  {formatCurrency(acc.current_balance ?? 0)}
                </p>
              </div>
            </button>
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

  // Calculate days until billing for each subscription
  const getSubscriptionStatus = (billingDay: number) => {
    const today = new Date().getDate();
    const daysUntil = billingDay >= today
      ? billingDay - today
      : 30 - today + billingDay;
    
    return {
      daysUntil,
      isUpcoming: daysUntil <= 3,
      label: daysUntil === 0 
        ? 'Vence hoje' 
        : daysUntil <= 3 
          ? `Vence em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`
          : `Dia ${billingDay}`,
    };
  };

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
    <section className="space-y-4">
      <div className="flex justify-between items-end mb-1 px-1">
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Assinaturas Ativas
        </h3>
        <button
          onClick={() => navigate('/subscriptions')}
          className="text-xs font-bold text-primary hover:underline transition-all"
        >
          Gerenciar todas →
        </button>
      </div>

      {/* Total Card */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white/70 text-xs font-medium">Total Mensal</p>
            <p className="text-2xl font-black">{formatCurrency(totalMonthly)}</p>
          </div>
          <Button
            onClick={() => navigate('/subscriptions')}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
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
            const status = getSubscriptionStatus(sub.billing_day);
            const card = cards?.find(c => c.id === sub.credit_card_id);

            return (
              <div
                key={sub.id}
                onClick={() => navigate('/subscriptions')}
                className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex gap-4 transition-all hover:shadow-md active:scale-[0.99] cursor-pointer"
              >
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl relative flex-shrink-0">
                  {sub.icon || '📦'}
                  {status.isUpcoming && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center">
                      <AlertCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sub.name}</h4>
                    <p className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(sub.amount)}
                    </p>
                  </div>
                  {card && (
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {card.name} ••{card.last_four_digits}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                        status.isUpcoming
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
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
