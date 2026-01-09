import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CreditCard, 
  Wallet, 
  CalendarClock,
  Plus,
  Settings,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

type WalletTab = 'accounts' | 'cards' | 'subs';

export function WalletPage() {
  const [activeTab, setActiveTab] = useState<WalletTab>('cards');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#F8FAFC]/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto">
          <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-800">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              U
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Carteira
          </h1>
          
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Total Balance */}
      <TotalBalance />

      {/* Tab Switcher */}
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      <div className="max-w-md mx-auto">
        {activeTab === 'accounts' && <AccountsTab />}
        {activeTab === 'cards' && <CardsTab />}
        {activeTab === 'subs' && <SubscriptionsTab />}
      </div>
    </div>
  );
}

function TotalBalance() {
  const { data: accounts } = useAccounts();
  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.current_balance, 0) ?? 0;

  return (
    <div className="px-6 py-6 text-center max-w-md mx-auto">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">
        Saldo Total
      </p>
      <h2 className="text-slate-900 dark:text-white tracking-tight text-4xl font-extrabold">
        {formatCurrency(totalBalance)}
      </h2>
    </div>
  );
}

function TabSwitcher({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: WalletTab; 
  onTabChange: (tab: WalletTab) => void;
}) {
  return (
    <div className="px-6 mb-8 max-w-md mx-auto">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
        <button
          onClick={() => onTabChange('accounts')}
          className={cn(
            "flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all",
            activeTab === 'accounts'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500"
          )}
        >
          Contas
        </button>
        <button
          onClick={() => onTabChange('cards')}
          className={cn(
            "flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all",
            activeTab === 'cards'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500"
          )}
        >
          Cartões
        </button>
        <button
          onClick={() => onTabChange('subs')}
          className={cn(
            "flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all",
            activeTab === 'subs'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500"
          )}
        >
          Assinaturas
        </button>
      </div>
    </div>
  );
}

function CardsTab() {
  const { data: cards } = useCreditCards();

  const totalAvailable = cards?.reduce(
    (sum, card) => sum + (card.credit_limit - (card.current_usage ?? 0)), 
    0
  ) ?? 0;

  return (
    <>
      <div className="px-6 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 shadow-2xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <CreditCard className="w-40 h-40" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                Crédito Disponível
              </p>
              <h3 className="text-white text-3xl font-extrabold mt-1">
                {formatCurrency(totalAvailable)}
              </h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {cards?.slice(0, 3).map((card) => (
                  <div 
                    key={card.id}
                    className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-white/20 flex items-center justify-center backdrop-blur-md"
                  >
                    <span className="text-white text-xs font-bold">
                      {card.name[0]}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button 
                size="sm" 
                className="bg-white text-indigo-600 hover:bg-white/90 font-bold shadow-md rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 mb-4">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">
          Meus Cartões
        </h2>
        <Button variant="link" size="sm" className="text-primary font-bold p-0">
          VER TODOS
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 px-6">
        {cards?.map(card => (
          <CreditCardItem key={card.id} card={card} />
        ))}
      </div>
    </>
  );
}

function CreditCardItem({ card }: { card: any }) {
  const available = card.credit_limit - (card.current_usage ?? 0);
  const usagePercent = ((card.current_usage ?? 0) / card.credit_limit) * 100;

  return (
    <Card className="p-4 rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
      <div className="flex items-center gap-4">
        <div 
          className="size-12 rounded-full flex items-center justify-center shadow-inner"
          style={{ backgroundColor: card.color || '#8B5CF6' }}
        >
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {card.brand || 'Cartão'}
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">
            {card.name}
          </h4>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(available)}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {usagePercent.toFixed(0)}% usado
          </p>
        </div>
      </div>
    </Card>
  );
}

function AccountsTab() {
  const { data: accounts } = useAccounts();

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.current_balance, 0) ?? 0;

  return (
    <>
      <div className="px-6 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-2xl shadow-emerald-500/20">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Wallet className="w-40 h-40" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                Saldo em Contas
              </p>
              <h3 className="text-white text-3xl font-extrabold mt-1">
                {formatCurrency(totalBalance)}
              </h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">
                  +12.5%
                </span>
              </div>
              
              <Button 
                size="sm" 
                className="bg-white text-emerald-600 hover:bg-white/90 font-bold shadow-md rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 mb-4">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">
          Minhas Contas
        </h2>
        <Button variant="link" size="sm" className="text-primary font-bold p-0">
          VER TODAS
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 px-6">
        {accounts?.map(account => (
          <AccountItem key={account.id} account={account} />
        ))}
      </div>
    </>
  );
}

function AccountItem({ account }: { account: any }) {
  return (
    <Card className="p-4 rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
      <div className="flex items-center gap-4">
        <div 
          className="size-12 rounded-full flex items-center justify-center shadow-inner"
          style={{ backgroundColor: account.color || '#3B82F6' }}
        >
          <Wallet className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
            {account.type}
          </p>
          <h4 className="font-bold text-slate-900 dark:text-white">
            {account.name}
          </h4>
        </div>
        
        <div className="text-right">
          <p className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(account.current_balance)}
          </p>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
            DISPONÍVEL
          </p>
        </div>
      </div>
    </Card>
  );
}

function SubscriptionsTab() {
  const { data: subscriptions } = useSubscriptions();

  const totalMonthly = subscriptions?.reduce((sum, sub) => sum + sub.amount, 0) ?? 0;

  return (
    <>
      <div className="px-6 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-6 shadow-2xl shadow-violet-500/20">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <CalendarClock className="w-40 h-40" />
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
                {subscriptions?.slice(0, 3).map((sub, i) => (
                  <div 
                    key={sub.id}
                    className="w-8 h-8 rounded-full border-2 border-violet-600 bg-white/20 flex items-center justify-center backdrop-blur-md"
                  >
                    <span className="text-white text-xs">
                      {i === 0 ? '🎬' : i === 1 ? '🎵' : '☁️'}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button 
                size="sm" 
                className="bg-white text-violet-600 hover:bg-white/90 font-bold shadow-md rounded-full"
              >
                <Plus className="w-4 h-4 mr-1" />
                Nova
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 mb-4">
        <h2 className="text-slate-900 dark:text-white text-lg font-bold">
          Minhas Assinaturas
        </h2>
        <Button variant="link" size="sm" className="text-primary font-bold p-0">
          VER TODAS
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 px-6">
        {subscriptions?.map(sub => (
          <SubscriptionItem key={sub.id} subscription={sub} />
        ))}
      </div>
    </>
  );
}

function SubscriptionItem({ subscription }: { subscription: any }) {
  return (
    <Card className="p-4 rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
      <div className="flex items-center gap-4">
        <div className="size-11 shrink-0 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <CalendarClock className="w-6 h-6 text-indigo-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-slate-900 dark:text-white font-bold text-sm">
            {subscription.name}
          </h4>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Vence dia {new Date(subscription.next_due_date).getDate()}
          </p>
        </div>
        
        <div className="text-right shrink-0">
          <span className="text-slate-900 dark:text-white font-bold text-sm">
            {formatCurrency(subscription.amount)}
          </span>
        </div>
      </div>
    </Card>
  );
}