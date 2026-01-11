import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, TrendingDown, Calendar, CreditCard, Check, Edit3, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CustomNumericKeypad } from '@/components/ui/CustomNumericKeypad';
import { InstallmentConfirmDialog } from '@/components/features/InstallmentConfirmDialog';
import { useCreateTransaction, useCategories, useCreditCards, useAccounts, useSmartCategorySearch } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';

const expenseSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category_id: z.string().optional(),
  credit_card_id: z.string().optional(),
  account_id: z.string().optional(),
  transaction_date: z.string(),
  is_installment: z.boolean(),
  total_installments: z.number().min(1).max(48),
  is_reimbursable: z.boolean(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

export default function NewExpensePage() {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit' | 'pix'>('credit');
  const [showKeypad, setShowKeypad] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showInstallmentConfirm, setShowInstallmentConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<ExpenseForm | null>(null);

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
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      is_installment: false,
      total_installments: 1,
      is_reimbursable: false,
    },
  });

  const amount = watch('amount');
  const isInstallment = watch('is_installment');
  const totalInstallments = watch('total_installments');

  // Smart category search
  const smartCategories = useSmartCategorySearch(categorySearch, amount);
  const displayCategories = categorySearch
    ? smartCategories.filter(c => !c.type || c.type === 'expense')
    : categories?.filter(c => !c.type || c.type === 'expense') ?? [];

  const handleAmountChange = (value: number) => {
    setValue('amount', value, { shouldDirty: true });
  };

  const handleFormSubmit = (data: ExpenseForm) => {
    if (data.is_installment && data.total_installments > 1) {
      setPendingSubmitData(data);
      setShowInstallmentConfirm(true);
      return;
    }
    submitTransaction(data);
  };

  const submitTransaction = (data: ExpenseForm) => {
    createTransaction(
      {
        type: 'expense',
        amount: data.amount,
        description: data.description,
        category_id: data.category_id || null,
        credit_card_id: paymentMethod === 'credit' ? data.credit_card_id : null,
        account_id: paymentMethod !== 'credit' ? data.account_id : null,
        transaction_date: data.transaction_date,
        is_installment: data.is_installment,
        total_installments: data.is_installment ? data.total_installments : 1,
        is_reimbursable: data.is_reimbursable,
        reimbursement_source: null,
        status: 'completed',
      },
      {
        onSuccess: () => {
          const installmentText = data.is_installment && data.total_installments > 1 
            ? ` em ${data.total_installments}x` 
            : '';
          toast({
            title: 'Despesa registrada!',
            description: `${formatCurrency(data.amount)}${installmentText}`,
            variant: 'success',
          });
          navigate('/');
        },
        onError: () => {
          toast({
            title: 'Erro ao criar despesa',
            description: 'Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-gradient-to-r from-red-500 to-rose-600 z-20">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-white" />
          <h1 className="text-base font-bold text-white">Nova Despesa</h1>
        </div>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 px-4 py-6">
        {/* Amount Display */}
        <div className="flex flex-col items-center justify-center mb-8">
          <button
            type="button"
            onClick={() => setShowKeypad(true)}
            className="flex items-baseline gap-2 px-6 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <span className="text-2xl font-medium text-slate-400">R$</span>
            <span className="text-5xl font-bold text-expense group-hover:scale-105 transition-transform">
              {amount > 0 ? formatCurrency(amount).replace('R$', '').trim() : '0,00'}
            </span>
            <Edit3 className="h-5 w-5 text-slate-300 group-hover:text-expense transition-colors ml-2" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Description */}
          <Card className="glass-card p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Descrição
            </label>
            <Input
              {...register('description')}
              placeholder="Ex: Almoço, Uber, Mercado..."
              error={errors.description?.message}
            />
          </Card>

          {/* Category with Smart Search */}
          <Card className="glass-card p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              Categoria
            </label>
            
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Buscar categoria..."
                className="pl-10 text-sm"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                >
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {displayCategories?.slice(0, 8).map((cat) => {
                const isSelected = watch('category_id') === cat.id;
                const hasScore = 'score' in cat;
                
                return (
                  <div key={cat.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        setValue('category_id', cat.id);
                        setCategorySearch('');
                      }}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                        isSelected
                          ? 'bg-expense text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {cat.name}
                      {isSelected && <Check className="h-3 w-3" />}
                      {hasScore && !isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-expense/10 text-expense font-bold">
                          {(cat as any).score}%
                        </span>
                      )}
                    </button>
                    {hasScore && categorySearch && (
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                        {(cat as any).reason}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Date */}
          <Card className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-expense/10 text-expense flex items-center justify-center">
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

          {/* Payment Method */}
          <Card className="glass-card p-4">
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
                    'flex-1 py-2 rounded-md text-xs font-bold transition-all',
                    paymentMethod === method
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500'
                  )}
                >
                  {method === 'credit' ? 'Crédito' : method === 'debit' ? 'Débito' : 'Pix'}
                </button>
              ))}
            </div>

            {/* Card/Account Selection */}
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
                        'flex-shrink-0 w-36 h-20 rounded-xl p-3 flex flex-col justify-between text-white shadow-md transition-all',
                        isSelected ? 'ring-2 ring-expense ring-offset-2' : ''
                      )}
                      style={{ backgroundColor: card.color || '#6366f1' }}
                    >
                      <div className="flex justify-between items-start text-xs font-bold">
                        {card.name}
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="text-sm font-mono opacity-90">
                        •••• {card.last_four_digits}
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
                        isSelected ? 'ring-2 ring-expense' : ''
                      )}
                    >
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{acc.name}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(acc.current_balance ?? 0)}</p>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </Card>

          {/* Installments */}
          {paymentMethod === 'credit' && (
            <Card className="glass-card p-4">
              <label className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Parcelar</p>
                  <p className="text-xs text-slate-500">Dividir em até 48x</p>
                </div>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => {
                    setValue('is_installment', e.target.checked);
                    if (!e.target.checked) setValue('total_installments', 1);
                  }}
                  className="rounded border-slate-300 text-expense focus:ring-expense h-5 w-5"
                />
              </label>

              {isInstallment && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500">Número de parcelas</span>
                    <span className="text-lg font-bold text-expense">{totalInstallments}x</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="48"
                    value={totalInstallments}
                    onChange={(e) => setValue('total_installments', Number(e.target.value))}
                    className="w-full accent-expense"
                  />
                  {amount > 0 && (
                    <p className="text-center text-xs text-slate-500 mt-3">
                      {totalInstallments}x de{' '}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(amount / totalInstallments)}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Reimbursable */}
          <Card className="glass-card p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Reembolsável</p>
                <p className="text-xs text-slate-500">Marque se será ressarcido</p>
              </div>
              <input
                type="checkbox"
                {...register('is_reimbursable')}
                className="rounded border-slate-300 text-expense focus:ring-expense h-5 w-5"
              />
            </label>
          </Card>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full mt-6 bg-expense hover:bg-red-600"
          isLoading={isPending}
        >
          <Check className="h-5 w-5 mr-2" />
          Registrar Despesa
        </Button>
      </form>

      {/* Installment Dialog */}
      <InstallmentConfirmDialog
        isOpen={showInstallmentConfirm}
        onClose={() => setShowInstallmentConfirm(false)}
        onConfirm={() => {
          if (pendingSubmitData) submitTransaction(pendingSubmitData);
          setShowInstallmentConfirm(false);
        }}
        totalAmount={pendingSubmitData?.amount ?? 0}
        installments={pendingSubmitData?.total_installments ?? 1}
        cardName={cards?.find(c => c.id === pendingSubmitData?.credit_card_id)?.name}
        startDate={pendingSubmitData?.transaction_date ? new Date(pendingSubmitData.transaction_date) : undefined}
        description={pendingSubmitData?.description ?? ''}
        isLoading={isPending}
      />

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
              Valor da Despesa
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
