import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, ArrowRightLeft, Calendar, Check, Edit3, Landmark, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CustomNumericKeypad } from '@/components/ui/CustomNumericKeypad';
import { useAccounts, useCreateTransaction } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';

const transferSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().optional(),
  from_account_id: z.string().min(1, 'Selecione a conta de origem'),
  to_account_id: z.string().min(1, 'Selecione a conta de destino'),
  transaction_date: z.string(),
}).refine((data) => data.from_account_id !== data.to_account_id, {
  message: 'A conta de origem deve ser diferente da conta de destino',
  path: ['to_account_id'],
});

type TransferForm = z.infer<typeof transferSchema>;

export default function NewTransferPage() {
  const navigate = useNavigate();

  const [showKeypad, setShowKeypad] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const { data: accounts } = useAccounts();
  const { mutateAsync: createTransaction } = useCreateTransaction();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      amount: 0,
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const amount = watch('amount');
  const fromAccountId = watch('from_account_id');
  const toAccountId = watch('to_account_id');

  const fromAccount = accounts?.find(a => a.id === fromAccountId);
  const toAccount = accounts?.find(a => a.id === toAccountId);

  const handleAmountChange = (value: number) => {
    setValue('amount', value, { shouldDirty: true });
  };

  const onSubmit = async (data: TransferForm) => {
    setIsPending(true);
    
    try {
      const description = data.description || `Transferência: ${fromAccount?.name} → ${toAccount?.name}`;
      
      // Create expense from source account
      await createTransaction({
        type: 'expense',
        amount: data.amount,
        description: `${description} (Saída)`,
        category_id: null,
        credit_card_id: null,
        account_id: data.from_account_id,
        transaction_date: data.transaction_date,
        is_installment: false,
        total_installments: 1,
        is_reimbursable: false,
        reimbursement_source: null,
        status: 'completed',
      });

      // Create income to destination account
      await createTransaction({
        type: 'income',
        amount: data.amount,
        description: `${description} (Entrada)`,
        category_id: null,
        credit_card_id: null,
        account_id: data.to_account_id,
        transaction_date: data.transaction_date,
        is_installment: false,
        total_installments: 1,
        is_reimbursable: false,
        reimbursement_source: null,
        status: 'completed',
      });

      toast({
        title: 'Transferência realizada!',
        description: `${formatCurrency(data.amount)} de ${fromAccount?.name} para ${toAccount?.name}`,
        variant: 'success',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Erro na transferência',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  // Filter available destination accounts
  const availableToAccounts = accounts?.filter(a => a.id !== fromAccountId) ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 z-20">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-white" />
          <h1 className="text-base font-bold text-white">Nova Transferência</h1>
        </div>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 py-6">
        {/* Amount Display */}
        <div className="flex flex-col items-center justify-center mb-8">
          <button
            type="button"
            onClick={() => setShowKeypad(true)}
            className="flex items-baseline gap-2 px-6 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <span className="text-2xl font-medium text-slate-400">R$</span>
            <span className="text-5xl font-bold text-primary group-hover:scale-105 transition-transform">
              {amount > 0 ? formatCurrency(amount).replace('R$', '').trim() : '0,00'}
            </span>
            <Edit3 className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors ml-2" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* From Account */}
          <Card className="glass-card p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              De (Origem)
            </label>
            {accounts?.length ? (
              <div className="grid grid-cols-2 gap-2">
                {accounts.map((acc) => {
                  const isSelected = fromAccountId === acc.id;
                  const isDisabled = toAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setValue('from_account_id', acc.id)}
                      className={cn(
                        'p-3 rounded-xl transition-all flex items-center gap-3',
                        isSelected 
                          ? 'bg-expense/10 ring-2 ring-expense' 
                          : 'bg-slate-100 dark:bg-slate-700',
                        isDisabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      <div className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-expense text-white' : 'bg-slate-200 dark:bg-slate-600'
                      )}>
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-500">{formatCurrency(acc.current_balance ?? 0)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                Nenhuma conta cadastrada
              </p>
            )}
            {errors.from_account_id && (
              <p className="text-xs text-expense mt-2">{errors.from_account_id.message}</p>
            )}
          </Card>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* To Account */}
          <Card className="glass-card p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              Para (Destino)
            </label>
            {availableToAccounts.length ? (
              <div className="grid grid-cols-2 gap-2">
                {availableToAccounts.map((acc) => {
                  const isSelected = toAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setValue('to_account_id', acc.id)}
                      className={cn(
                        'p-3 rounded-xl transition-all flex items-center gap-3',
                        isSelected 
                          ? 'bg-income/10 ring-2 ring-income' 
                          : 'bg-slate-100 dark:bg-slate-700'
                      )}
                    >
                      <div className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-income text-white' : 'bg-slate-200 dark:bg-slate-600'
                      )}>
                        <Landmark className="h-4 w-4" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-500">{formatCurrency(acc.current_balance ?? 0)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                {fromAccountId ? 'Selecione uma conta diferente' : 'Selecione a conta de origem primeiro'}
              </p>
            )}
            {errors.to_account_id && (
              <p className="text-xs text-expense mt-2">{errors.to_account_id.message}</p>
            )}
          </Card>

          {/* Description */}
          <Card className="glass-card p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Descrição (opcional)
            </label>
            <Input
              {...register('description')}
              placeholder="Ex: Reserva de emergência..."
            />
          </Card>

          {/* Date */}
          <Card className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Data</label>
                <input
                  type="date"
                  {...register('transaction_date')}
                  className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0"
                />
              </div>
            </div>
          </Card>

          {/* Transfer Summary */}
          {fromAccount && toAccount && amount > 0 && (
            <Card className="glass-card p-4 bg-primary/5 border-primary/20">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">
                Resumo da Transferência
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">{fromAccount.name}</span>
                <ArrowRight className="h-4 w-4 text-primary mx-2" />
                <span className="text-slate-600 dark:text-slate-300">{toAccount.name}</span>
              </div>
              <p className="text-lg font-bold text-primary text-center mt-2">
                {formatCurrency(amount)}
              </p>
            </Card>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full mt-6 bg-primary hover:bg-blue-600"
          isLoading={isPending}
          disabled={!fromAccountId || !toAccountId || amount <= 0}
        >
          <Check className="h-5 w-5 mr-2" />
          Realizar Transferência
        </Button>
      </form>

      {/* Keypad Modal */}
      {showKeypad && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowKeypad(false)}
          />
          <div className="glass-modal relative w-full max-w-md p-6 rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <button
              type="button"
              onClick={() => setShowKeypad(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">
              Valor da Transferência
            </h3>
            <CustomNumericKeypad
              value={amount}
              onChange={handleAmountChange}
              onConfirm={() => setShowKeypad(false)}
              maxValue={999999.99}
              currency="BRL"
            />
          </div>
        </div>
      )}
    </div>
  );
}
