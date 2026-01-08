import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  ArrowRight, 
  Check,
  ArrowLeftRight,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAccounts, useCreateTransaction } from '@/hooks';
import { useHouseholdId } from '@/stores';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import type { Account } from '@/types';

export default function TransferPage() {
  const navigate = useNavigate();
  const householdId = useHouseholdId();
  
  const { data: accounts, isLoading } = useAccounts();
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();
  
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'from' | 'to' | 'amount'>('from');

  const fromAccount = accounts?.find(a => a.id === fromAccountId);
  const toAccount = accounts?.find(a => a.id === toAccountId);
  
  const numericAmount = useMemo(() => {
    return parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;
  }, [amount]);

  const availableToAccounts = useMemo(() => {
    return accounts?.filter(a => a.id !== fromAccountId) ?? [];
  }, [accounts, fromAccountId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setAmount(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
  };

  const handleFromSelect = (account: Account) => {
    setFromAccountId(account.id);
    setStep('to');
  };

  const handleToSelect = (account: Account) => {
    setToAccountId(account.id);
    setStep('amount');
  };

  const handleSwapAccounts = () => {
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  };

  const handleSubmit = async () => {
    if (!fromAccountId || !toAccountId || !numericAmount || !householdId) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    if (numericAmount > (fromAccount?.current_balance ?? 0)) {
      toast({ 
        title: 'Saldo insuficiente', 
        description: `Saldo disponível: ${formatCurrency(fromAccount?.current_balance ?? 0)}`,
        variant: 'destructive' 
      });
      return;
    }

    const transferId = `transfer_${Date.now()}`;
    const transferDescription = description.trim() || `Transferência: ${fromAccount?.name} → ${toAccount?.name}`;

    try {
      // 1. Criar despesa na conta de origem
      await createTransaction({
        household_id: householdId,
        account_id: fromAccountId,
        type: 'expense',
        amount: numericAmount,
        description: transferDescription,
        transaction_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        metadata: { transfer_id: transferId, transfer_type: 'out', linked_account: toAccountId },
      });

      // 2. Criar receita na conta de destino
      await createTransaction({
        household_id: householdId,
        account_id: toAccountId,
        type: 'income',
        amount: numericAmount,
        description: transferDescription,
        transaction_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        metadata: { transfer_id: transferId, transfer_type: 'in', linked_account: fromAccountId },
      });

      toast({ 
        title: 'Transferência realizada!', 
        description: `${formatCurrency(numericAmount)} transferido com sucesso.`,
        variant: 'success' 
      });
      
      navigate('/wallet');
    } catch (error) {
      console.error('Transfer error:', error);
      toast({ 
        title: 'Erro na transferência', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-12 w-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  if (!accounts?.length || accounts.length < 2) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">Transferência</h1>
          <div className="w-10" />
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="p-8 text-center max-w-sm">
            <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Contas insuficientes
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Você precisa de pelo menos 2 contas para fazer uma transferência.
            </p>
            <Button onClick={() => navigate('/accounts/new')}>
              Criar nova conta
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-20">
        <button
          onClick={() => {
            if (step === 'amount') setStep('to');
            else if (step === 'to') setStep('from');
            else navigate(-1);
          }}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Transferência
          </h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Progress */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2">
          {['from', 'to', 'amount'].map((s, i) => (
            <div
              key={s}
              className={cn(
                'flex-1 h-1 rounded-full transition-all',
                (step === 'from' && i === 0) ||
                (step === 'to' && i <= 1) ||
                (step === 'amount')
                  ? 'bg-primary'
                  : 'bg-slate-200 dark:bg-slate-700'
              )}
            />
          ))}
        </div>
      </div>

      {/* Transfer Preview (when accounts selected) */}
      {(fromAccount || toAccount) && (
        <div className="px-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              {/* From Account */}
              <div className="flex-1 text-center">
                {fromAccount ? (
                  <>
                    <div
                      className="h-12 w-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: fromAccount.color || '#6366f1' }}
                    >
                      {fromAccount.name.substring(0, 2).toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {fromAccount.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatCurrency(fromAccount.current_balance ?? 0)}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-xl mx-auto mb-2 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">Origem</p>
                  </>
                )}
              </div>

              {/* Arrow / Swap */}
              <button
                onClick={handleSwapAccounts}
                disabled={!fromAccount || !toAccount}
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center transition-all',
                  fromAccount && toAccount
                    ? 'bg-primary text-white hover:scale-110'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                )}
              >
                <ArrowRight className="h-5 w-5" />
              </button>

              {/* To Account */}
              <div className="flex-1 text-center">
                {toAccount ? (
                  <>
                    <div
                      className="h-12 w-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: toAccount.color || '#6366f1' }}
                    >
                      {toAccount.name.substring(0, 2).toUpperCase()}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {toAccount.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatCurrency(toAccount.current_balance ?? 0)}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-xl mx-auto mb-2 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-400">Destino</p>
                  </>
                )}
              </div>
            </div>

            {/* Amount Preview */}
            {numericAmount > 0 && step === 'amount' && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                <p className="text-3xl font-black text-primary">
                  {formatCurrency(numericAmount)}
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 px-4 pb-8">
        {step === 'from' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              De qual conta?
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Selecione a conta de origem da transferência
            </p>
            
            <div className="space-y-2">
              {accounts?.map((account) => (
                <AccountSelector
                  key={account.id}
                  account={account}
                  isSelected={fromAccountId === account.id}
                  onClick={() => handleFromSelect(account)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'to' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Para qual conta?
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Selecione a conta de destino
            </p>
            
            <div className="space-y-2">
              {availableToAccounts.map((account) => (
                <AccountSelector
                  key={account.id}
                  account={account}
                  isSelected={toAccountId === account.id}
                  onClick={() => handleToSelect(account)}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'amount' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Qual o valor?
              </h2>
              <p className="text-sm text-slate-500">
                Saldo disponível: <strong className="text-income">{formatCurrency(fromAccount?.current_balance ?? 0)}</strong>
              </p>
            </div>
            
            {/* Amount Input */}
            <Card className="p-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-medium text-slate-400">R$</span>
                <input
                  autoFocus
                  className="text-4xl font-black bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-300 text-center max-w-[200px]"
                  placeholder="0,00"
                  value={amount}
                  onChange={handleAmountChange}
                  inputMode="numeric"
                />
              </div>
            </Card>

            {/* Description */}
            <Card className="p-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Descrição (opcional)
              </label>
              <input
                type="text"
                className="w-full bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                placeholder="Ex: Reserva de emergência"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Card>

            {/* Insufficient Balance Warning */}
            {numericAmount > (fromAccount?.current_balance ?? 0) && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-xs font-medium">
                  Saldo insuficiente na conta de origem
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              size="xl"
              className="w-full"
              onClick={handleSubmit}
              disabled={!numericAmount || numericAmount > (fromAccount?.current_balance ?? 0)}
              isLoading={isPending}
            >
              <Check className="h-5 w-5 mr-2" />
              Confirmar Transferência
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Account Selector Component
// ============================================================================

function AccountSelector({
  account,
  isSelected,
  onClick,
}: {
  account: Account;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200'
      )}
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
        style={{ backgroundColor: account.color || '#6366f1' }}
      >
        {account.name.substring(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-900 dark:text-white truncate">
          {account.name}
        </h4>
        <p className="text-sm text-slate-500">
          {formatCurrency(account.current_balance ?? 0)}
        </p>
      </div>
      {isSelected && (
        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
    </button>
  );
}
