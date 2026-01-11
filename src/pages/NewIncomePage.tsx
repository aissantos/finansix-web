import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, TrendingUp, Calendar, Check, Edit3, Search, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CustomNumericKeypad } from '@/components/ui/CustomNumericKeypad';
import { useCreateTransaction, useCategories, useAccounts, useSmartCategorySearch } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';

const incomeSchema = z.object({
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category_id: z.string().optional(),
  account_id: z.string().optional(),
  transaction_date: z.string(),
});

type IncomeForm = z.infer<typeof incomeSchema>;

export default function NewIncomePage() {
  const navigate = useNavigate();

  const [showKeypad, setShowKeypad] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: 0,
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const amount = watch('amount');

  // Smart category search
  const smartCategories = useSmartCategorySearch(categorySearch, amount);
  const displayCategories = categorySearch
    ? smartCategories.filter(c => !c.type || c.type === 'income')
    : categories?.filter(c => !c.type || c.type === 'income') ?? [];

  const handleAmountChange = (value: number) => {
    setValue('amount', value, { shouldDirty: true });
  };

  const onSubmit = (data: IncomeForm) => {
    createTransaction(
      {
        type: 'income',
        amount: data.amount,
        description: data.description,
        category_id: data.category_id || null,
        credit_card_id: null,
        account_id: data.account_id || null,
        transaction_date: data.transaction_date,
        is_installment: false,
        total_installments: 1,
        is_reimbursable: false,
        reimbursement_source: null,
        status: 'completed',
      },
      {
        onSuccess: () => {
          toast({
            title: 'Receita registrada!',
            description: formatCurrency(data.amount),
            variant: 'success',
          });
          navigate('/');
        },
        onError: () => {
          toast({
            title: 'Erro ao criar receita',
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
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 z-20">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-white" />
          <h1 className="text-base font-bold text-white">Nova Receita</h1>
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
            <span className="text-5xl font-bold text-income group-hover:scale-105 transition-transform">
              {amount > 0 ? formatCurrency(amount).replace('R$', '').trim() : '0,00'}
            </span>
            <Edit3 className="h-5 w-5 text-slate-300 group-hover:text-income transition-colors ml-2" />
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
              placeholder="Ex: Salário, Freelance, Dividendos..."
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
                          ? 'bg-income text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      )}
                    >
                      {cat.name}
                      {isSelected && <Check className="h-3 w-3" />}
                      {hasScore && !isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-income/10 text-income font-bold">
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

          {/* Account Selection */}
          <Card className="glass-card p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              Conta de Destino
            </label>
            {accounts?.length ? (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                {accounts.map((acc) => {
                  const isSelected = watch('account_id') === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setValue('account_id', acc.id)}
                      className={cn(
                        'flex-shrink-0 px-4 py-3 rounded-xl transition-all flex items-center gap-3',
                        isSelected 
                          ? 'bg-income/10 ring-2 ring-income' 
                          : 'bg-slate-100 dark:bg-slate-700'
                      )}
                    >
                      <div className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center',
                        isSelected ? 'bg-income text-white' : 'bg-slate-200 dark:bg-slate-600'
                      )}>
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{acc.name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(acc.current_balance ?? 0)}</p>
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
          </Card>

          {/* Date */}
          <Card className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-income/10 text-income flex items-center justify-center">
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
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full mt-6 bg-income hover:bg-green-600"
          isLoading={isPending}
        >
          <Check className="h-5 w-5 mr-2" />
          Registrar Receita
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
              Valor da Receita
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
