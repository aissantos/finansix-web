import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, TrendingDown, TrendingUp, Calendar, CreditCard, Check, Edit3, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CustomNumericKeypad } from '@/components/ui/CustomNumericKeypad';
import { InstallmentConfirmDialog } from '@/components/features/InstallmentConfirmDialog';
import { useCreateTransaction, useCategories, useCreditCards, useAccounts, useSmartCategorySearch } from '@/hooks';
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
  const [showKeypad, setShowKeypad] = useState(false); // NEW v2.0: Modal keypad control
  const [categorySearch, setCategorySearch] = useState(''); // NEW v2.0: Smart search
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

  // NEW v2.0: Smart category search with ML scoring
  const smartCategories = useSmartCategorySearch(categorySearch, amount);

  // NEW v2.0: Use smart categories if searching, otherwise filter by type
  const displayCategories = categorySearch
    ? smartCategories.filter(c => !c.type || c.type === transactionType)
    : categories?.filter(c => !c.type || c.type === transactionType) ?? [];

  // NEW v2.0: Handler for keypad value change
  const handleAmountChange = (value: number) => {
    setValue('amount', value, { shouldDirty: true });
  };

  // NEW v2.0: Handler for keypad confirm
  const handleKeypadConfirm = () => {
    setShowKeypad(false);
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

        {/* NEW v2.0: Amount Display with Keypad Button */}
        <div className="flex flex-col items-center justify-center mb-10">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Valor
          </label>
          <button
            type="button"
            onClick={() => setShowKeypad(true)}
            className="flex items-baseline gap-2 px-6 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <span className="text-3xl font-medium text-slate-400">R$</span>
            <span className="text-5xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
              {amount > 0 ? formatCurrency(amount).replace('R$', '').trim() : '0,00'}
            </span>
            <Edit3 className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors ml-2" />
          </button>
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

          {/* Category - NEW v2.0: With Smart Search */}
          <Card className="p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              Categoria
            </label>
            
            {/* Search Input */}
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
            
            {/* Categories Grid */}
            <div className="flex flex-wrap gap-2">
              {displayCategories?.slice(0, 8).map((cat) => {
                const isSelected = watch('category_id') === cat.id;
                const hasScore = 'score' in cat && 'reason' in cat;
                
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
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {cat.name}
                      {isSelected && <Check className="h-3 w-3" />}
                      {hasScore && !isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
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
            
            {categorySearch && displayCategories.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                Nenhuma categoria encontrada
              </p>
            )}
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

          {/* Installments - only for credit card */}
          {paymentMethod === 'credit' && transactionType === 'expense' && (
            <Card className="p-4">
              <label className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Parcelar
                  </p>
                  <p className="text-xs text-slate-500">
                    Dividir em até 48x
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => {
                    setValue('is_installment', e.target.checked);
                    if (!e.target.checked) setValue('total_installments', 1);
                  }}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5"
                />
              </label>

              {isInstallment && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500">Número de parcelas</span>
                    <span className="text-lg font-bold text-primary">{totalInstallments}x</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="48"
                    value={totalInstallments}
                    onChange={(e) => setValue('total_installments', Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>2x</span>
                    <span>24x</span>
                    <span>48x</span>
                  </div>
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

      {/* NEW v2.0: Custom Numeric Keypad Modal */}
      {showKeypad && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowKeypad(false)}
          />
          
          {/* Modal */}
          <div className="glass-modal relative w-full max-w-md p-6 rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0">
            <button
              type="button"
              onClick={() => setShowKeypad(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">
              Digite o Valor
            </h3>
            
            <CustomNumericKeypad
              value={amount}
              onChange={handleAmountChange}
              onConfirm={handleKeypadConfirm}
              maxValue={999999.99}
              currency="BRL"
            />
          </div>
        </div>
      )}
    </div>
  );
}
