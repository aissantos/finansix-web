import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, TrendingDown, TrendingUp, Calendar, CreditCard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { InstallmentConfirmDialog } from '@/components/features/InstallmentConfirmDialog';
import { useCreateTransaction, useCategories, useCreditCards, useAccounts } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';
import type { TransactionType } from '@/types';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category_id: z.string().optional(),
  credit_card_id: z.string().optional(),
  account_id: z.string().optional(),
  transaction_date: z.string(),
  is_installment: z.boolean(),
  total_installments: z.number().min(1).max(48),
  is_reimbursable: z.boolean(),
  reimbursement_source: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

export default function NewTransactionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category');

  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix'>('credit');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [showInstallmentConfirm, setShowInstallmentConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<TransactionForm | null>(null);

  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { data: categories } = useCategories();
  const { data: cards } = useCreditCards();
  const { data: accounts } = useAccounts();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      description: '',
      category_id: preselectedCategory || undefined,
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      is_installment: false,
      total_installments: 1,
      is_reimbursable: false,
    },
  });

  const transactionType = watch('type');
  const isInstallment = watch('is_installment');
  const totalInstallments = watch('total_installments');
  const amount = watch('amount');

  const filteredCategories = categories?.filter(
    (c) => !c.type || c.type === transactionType
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setAmountDisplay(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
    setValue('amount', numValue);
  };

  const handleFormSubmit = (data: TransactionForm) => {
    // Se tem parcelas > 1, mostrar confirmação
    if (data.is_installment && data.total_installments > 1) {
      setPendingSubmitData(data);
      setShowInstallmentConfirm(true);
      return;
    }
    
    // Submeter diretamente se não tem parcelas
    submitTransaction(data);
  };

  const submitTransaction = (data: TransactionForm) => {
    createTransaction(
      {
        type: data.type as TransactionType,
        amount: data.amount,
        description: data.description,
        category_id: data.category_id || null,
        credit_card_id: paymentMethod === 'credit' ? data.credit_card_id : null,
        account_id: paymentMethod !== 'credit' ? data.account_id : null,
        transaction_date: data.transaction_date,
        is_installment: data.is_installment,
        total_installments: data.is_installment ? data.total_installments : 1,
        is_reimbursable: data.is_reimbursable,
        reimbursement_source: data.is_reimbursable ? data.reimbursement_source : null,
        status: 'completed',
      },
      {
        onSuccess: () => {
          const installmentText = data.is_installment && data.total_installments > 1 
            ? ` em ${data.total_installments}x` 
            : '';
          toast({
            title: 'Transação criada!',
            description: `${data.type === 'income' ? 'Receita' : 'Despesa'} de ${formatCurrency(data.amount)}${installmentText} registrada.`,
            variant: 'success',
          });
          navigate('/');
        },
        onError: () => {
          toast({
            title: 'Erro ao criar transação',
            description: 'Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleInstallmentConfirm = () => {
    if (pendingSubmitData) {
      submitTransaction(pendingSubmitData);
    }
    setShowInstallmentConfirm(false);
    setPendingSubmitData(null);
  };

  const handleInstallmentCancel = () => {
    setShowInstallmentConfirm(false);
    setPendingSubmitData(null);
  };

  const onSubmit = handleFormSubmit;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-20">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 transition-colors shadow-sm"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          {transactionType === 'expense' ? 'Nova Despesa' : 'Nova Receita'}
        </h1>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8">
        {/* Type Toggle */}
        <div className="bg-slate-200/60 dark:bg-slate-800 p-1.5 rounded-xl flex items-center mb-8">
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2',
              transactionType === 'expense'
                ? 'bg-white dark:bg-slate-700 text-expense shadow-sm'
                : 'text-slate-500'
            )}
          >
            <TrendingDown className="h-4 w-4" />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'income')}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2',
              transactionType === 'income'
                ? 'bg-white dark:bg-slate-700 text-income shadow-sm'
                : 'text-slate-500'
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Receita
          </button>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col items-center justify-center mb-10">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Valor
          </label>
          <div className="flex items-baseline gap-1 relative">
            <span className="text-3xl font-medium text-slate-400">R$</span>
            <input
              autoFocus
              className="text-5xl font-bold bg-transparent border-none p-0 w-48 text-center focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-200"
              placeholder="0,00"
              value={amountDisplay}
              onChange={handleAmountChange}
              inputMode="numeric"
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-expense mt-2">{errors.amount.message}</p>
          )}
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-4">
          {/* Description */}
          <Card className="p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Descrição
            </label>
            <Input
              {...register('description')}
              placeholder="Ex: Almoço de domingo"
              error={errors.description?.message}
            />
          </Card>

          {/* Category */}
          <Card className="p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {filteredCategories?.slice(0, 8).map((cat) => {
                const isSelected = watch('category_id') === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setValue('category_id', cat.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                      isSelected
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    )}
                  >
                    {cat.name}
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Date */}
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-primary flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Data
                </label>
                <input
                  type="date"
                  {...register('transaction_date')}
                  className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-none p-0 focus:ring-0"
                />
              </div>
            </div>
          </Card>

          {/* Payment Method (only for expenses) */}
          {transactionType === 'expense' && (
            <Card className="p-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
                Forma de Pagamento
              </label>
              <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg flex mb-4">
                {(['credit', 'debit', 'pix'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      'flex-1 py-1.5 rounded-md text-xs font-bold transition-all',
                      paymentMethod === method
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500'
                    )}
                  >
                    {method === 'credit' ? 'Crédito' : method === 'debit' ? 'Débito' : 'Pix'}
                  </button>
                ))}
              </div>

              {/* Card Selection */}
              {paymentMethod === 'credit' && cards?.length ? (
                <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                  {cards.map((card) => {
                    const isSelected = watch('credit_card_id') === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => setValue('credit_card_id', card.id)}
                        className={cn(
                          'flex-shrink-0 w-40 h-24 rounded-xl p-3 flex flex-col justify-between text-white shadow-md relative overflow-hidden transition-all',
                          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                        )}
                        style={{ backgroundColor: card.color || '#6366f1' }}
                      >
                        <div className="flex justify-between items-start text-xs font-bold">
                          {card.name}
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-1 opacity-90 text-sm font-mono">
                          <span>••••</span>
                          <span>{card.last_four_digits}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : paymentMethod !== 'credit' && accounts?.length ? (
                <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                  {accounts.map((acc) => {
                    const isSelected = watch('account_id') === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setValue('account_id', acc.id)}
                        className={cn(
                          'flex-shrink-0 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 transition-all',
                          isSelected ? 'ring-2 ring-primary' : ''
                        )}
                      >
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {acc.name}
                        </p>
                        <p className="text-xs text-slate-500">{formatCurrency(acc.current_balance ?? 0)}</p>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          )}

          {/* Installments (only for credit card) */}
          {transactionType === 'expense' && paymentMethod === 'credit' && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Parcelamento
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('is_installment')}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Parcelar
                  </span>
                </label>
              </div>

              {isInstallment && (
                <div className="space-y-3">
                  <input
                    type="range"
                    min="2"
                    max="12"
                    {...register('total_installments', { valueAsNumber: true })}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>2x</span>
                    <span className="text-primary font-bold">
                      {totalInstallments}x de {formatCurrency(amount / totalInstallments)}
                    </span>
                    <span>12x</span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Reimbursable */}
          <Card className="p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Reembolsável
                </p>
                <p className="text-xs text-slate-500">
                  Marque se será ressarcido
                </p>
              </div>
              <input
                type="checkbox"
                {...register('is_reimbursable')}
                className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5"
              />
            </label>
          </Card>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full mt-6"
          isLoading={isPending}
        >
          <Check className="h-5 w-5 mr-2" />
          Salvar Transação
        </Button>
      </form>

      {/* Installment Confirmation Dialog */}
      <InstallmentConfirmDialog
        isOpen={showInstallmentConfirm}
        onClose={handleInstallmentCancel}
        onConfirm={handleInstallmentConfirm}
        totalAmount={pendingSubmitData?.amount ?? 0}
        installments={pendingSubmitData?.total_installments ?? 1}
        cardName={cards?.find(c => c.id === pendingSubmitData?.credit_card_id)?.name}
        startDate={pendingSubmitData?.transaction_date ? new Date(pendingSubmitData.transaction_date) : undefined}
        description={pendingSubmitData?.description ?? ''}
        isLoading={isPending}
      />
    </div>
  );
}
