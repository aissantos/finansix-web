import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Edit3,
  Landmark,
  PiggyBank,
  DollarSign,
  MoreVertical,
  Trash2,
  ArrowLeftRight,
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAccounts, useTransactions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const accountTypeConfig: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
  checking: { 
    label: 'Conta Corrente', 
    icon: <Landmark className="h-5 w-5" />,
    description: 'Conta bancária para movimentações do dia a dia',
  },
  savings: { 
    label: 'Poupança', 
    icon: <PiggyBank className="h-5 w-5" />,
    description: 'Reserva de emergência e economias',
  },
  investment: { 
    label: 'Investimento', 
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Corretora, fundos e aplicações',
  },
  cash: { 
    label: 'Dinheiro', 
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Dinheiro físico em carteira',
  },
};

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  
  const [showMenu, setShowMenu] = useState(false);

  const account = accounts?.find(a => a.id === id);
  
  // Filter transactions for this account
  const accountTransactions = useMemo(() => {
    if (!transactions || !account) return [];
    return transactions.filter(t => t.account_id === account.id);
  }, [transactions, account]);

  // Calculate stats for current month
  const currentMonth = new Date();
  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);
  const lastMonthStart = startOfMonth(subMonths(currentMonth, 1));
  const lastMonthEnd = endOfMonth(subMonths(currentMonth, 1));

  const stats = useMemo(() => {
    const currentMonthTxs = accountTransactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= currentMonthStart && date <= currentMonthEnd;
    });

    const lastMonthTxs = accountTransactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const currentIncome = currentMonthTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpense = currentMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastExpense = lastMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseChange = lastExpense > 0 
      ? ((currentExpense - lastExpense) / lastExpense) * 100 
      : 0;

    return {
      currentIncome,
      currentExpense,
      expenseChange,
      transactionCount: currentMonthTxs.length,
    };
  }, [accountTransactions, currentMonthStart, currentMonthEnd, lastMonthStart, lastMonthEnd]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    return accountTransactions
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 5);
  }, [accountTransactions]);

  if (accountsLoading) {
    return (
      <>
        <Header title="Carregando..." showBack onBack={() => navigate('/wallet')} />
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!account) {
    return (
      <>
        <Header title="Conta não encontrada" showBack onBack={() => navigate('/wallet')} />
        <PageContainer>
          <Card className="p-8 text-center">
            <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Esta conta não existe ou foi removida.</p>
            <Button onClick={() => navigate('/wallet')} className="mt-4">
              Voltar para Carteira
            </Button>
          </Card>
        </PageContainer>
      </>
    );
  }

  const config = accountTypeConfig[account.type] || accountTypeConfig.checking;
  const isNegative = (account.current_balance ?? 0) < 0;

  return (
    <>
      <Header 
        title={account.name} 
        showBack 
        onBack={() => navigate('/wallet')} 
      />
      <PageContainer className="space-y-6">
        {/* Hero Card */}
        <div 
          className="relative overflow-hidden rounded-3xl p-6 shadow-2xl"
          style={{ 
            background: `linear-gradient(135deg, ${account.color || '#3B82F6'} 0%, ${account.color || '#3B82F6'}dd 100%)` 
          }}
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <Wallet className="w-48 h-48" />
          </div>

          <div className="relative z-10">
            {/* Account Info */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  {config.icon}
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">{account.name}</h2>
                  <p className="text-white/70 text-sm">{config.label}</p>
                </div>
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <MoreVertical className="h-5 w-5 text-white" />
                </button>

                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMenu(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[160px]">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/accounts/${account.id}/edit`);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Edit3 className="h-4 w-4 text-slate-400" />
                        Editar Conta
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/accounts/${account.id}/edit`);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Balance */}
            <div className="mb-6">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">
                Saldo Atual
              </p>
              <h3 className={`text-4xl font-extrabold ${isNegative ? 'text-red-200' : 'text-white'}`}>
                {formatCurrency(account.current_balance ?? 0)}
              </h3>
              {account.initial_balance !== undefined && account.initial_balance !== account.current_balance && (
                <p className="text-white/60 text-sm mt-1">
                  Saldo inicial: {formatCurrency(account.initial_balance)}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/transactions/new')}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Transação
              </Button>
              <Button
                onClick={() => navigate('/transfer')}
                size="sm"
                className="bg-white text-slate-800 hover:bg-white/90"
              >
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                Transferir
              </Button>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Resumo do Mês
            </h3>
            <Badge variant="outline" className="font-mono">
              {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Income */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs text-slate-500 font-medium">Entradas</span>
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.currentIncome)}
              </p>
            </Card>

            {/* Expenses */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-xs text-slate-500 font-medium">Saídas</span>
              </div>
              <p className="text-xl font-bold text-red-600">
                {formatCurrency(stats.currentExpense)}
              </p>
              {stats.expenseChange !== 0 && (
                <p className={`text-xs mt-1 ${stats.expenseChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.expenseChange > 0 ? '↑' : '↓'} {Math.abs(stats.expenseChange).toFixed(0)}% vs mês anterior
                </p>
              )}
            </Card>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Últimas Transações
            </h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-primary text-xs font-bold hover:underline"
            >
              VER TODAS →
            </button>
          </div>

          {transactionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <Card 
                  key={tx.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/transactions/${tx.id}/edit`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'income' 
                          ? 'bg-green-100 dark:bg-green-900/20' 
                          : 'bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {tx.type === 'income' ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {tx.description}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(tx.transaction_date), 'dd MMM', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold ${
                      tx.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhuma transação nesta conta</p>
              <Button 
                onClick={() => navigate('/transactions/new')} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Transação
              </Button>
            </Card>
          )}
        </div>

        {/* Account Info */}
        <Card className="p-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Informações da Conta
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tipo</span>
              <span className="font-medium text-slate-900 dark:text-white">{config.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Moeda</span>
              <span className="font-medium text-slate-900 dark:text-white">{account.currency || 'BRL'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transações este mês</span>
              <span className="font-medium text-slate-900 dark:text-white">{stats.transactionCount}</span>
            </div>
            {account.created_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">Criada em</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {format(new Date(account.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Bank Details */}
        {(account.bank_name || account.branch_number || account.account_number || account.pix_key) && (
          <Card className="p-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Dados Bancários
            </h4>
            <div className="space-y-3 text-sm">
              {account.bank_name && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Banco</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {account.bank_name}
                    {account.bank_code && (
                      <span className="text-xs text-slate-400 ml-2">({account.bank_code})</span>
                    )}
                  </span>
                </div>
              )}
              {account.branch_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Agência</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {account.branch_number}
                  </span>
                </div>
              )}
              {account.account_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Conta</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    {account.account_number}
                    {account.account_digit && `-${account.account_digit}`}
                  </span>
                </div>
              )}
              {account.pix_key && (
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Chave PIX</span>
                    <div className="text-right">
                      {account.pix_key_type && (
                        <div className="text-xs text-slate-400 uppercase mb-1">
                          {account.pix_key_type === 'cpf' && 'CPF'}
                          {account.pix_key_type === 'cnpj' && 'CNPJ'}
                          {account.pix_key_type === 'email' && 'E-mail'}
                          {account.pix_key_type === 'phone' && 'Telefone'}
                          {account.pix_key_type === 'random' && 'Aleatória'}
                        </div>
                      )}
                      <span className="font-mono font-medium text-slate-900 dark:text-white break-all">
                        {account.pix_key}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Edit Button */}
        <Button
          onClick={() => navigate(`/accounts/${account.id}/edit`)}
          variant="outline"
          className="w-full"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Editar Conta
        </Button>
      </PageContainer>
    </>
  );
}
