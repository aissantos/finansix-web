import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, TrendingUp, Calendar, Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
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
  const [searchParams] = useSearchParams();
  const preselectedCategory = searchParams.get('category');

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
      category_id: preselectedCategory || undefined,
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const amount = watch('amount');

  const smartCategories = useSmartCategorySearch(categorySearch, amount);
  const displayCategories = categorySearch
    ? smartCategories.filter(c => !c.type || c.type === 'income')
    : categories?.filter(c => !c.type || c.type === 'income') ?? [];

  const handleAmountChange = (value: number) => {
    setValue('amount', value, { shouldDirty: true });
  };

  const handleKeypadConfirm = () => {
    setShowKeypad(false);
  };

  const onSubmit = (data: IncomeForm) => {
    createTransaction(
      {
        type: 'income',
        amount: data.amount,
        description: data.description,
        category_id: data.category_id || null,
        account_id: data.account_id || null,
        transaction_date: data.transaction_date,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Receita criada!',
            description: `Receita de ${formatCurrency(data.amount)} registrada.`,
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
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-20">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 transition-colors shadow-sm"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-income/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-income" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Nova Receita
          </h1>
        </div>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8">
        {/* Amount Card */}
        <Card className="p-6 mb-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-income/20">
          <p className="text-xs font-bold text-income/70 uppercase tracking-wide mb-2">
            Valor da Receita
          </p>
          <button
            type="button"
            onClick={() => setShowKeypad(true)}
            className="w-full text-left"
          >
            <span className="text-4xl font-black text-income">
              {amount > 0 ? formatCurrency(amount) : 'R$ 0,00'}
            </span>
          </button>
          {errors.amount && (
            <p className="text-xs text-red-500 mt-2">{errors.amount.message}</p>
          )}
        </Card>

        {/* Description */}
        <Card className="p-4 mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Descrição
          </label>
          <input
            {...register('description')}
            type="text"
            className="w-full bg-transparent border-none p-0 text-lg font-medium focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
            placeholder="Ex: Salário, Freelance, Pix..."
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-2">{errors.description.message}</p>
          )}
        </Card>

        {/* Date */}
        <Card className="p-4 mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Data
          </label>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-400" />
            <input
              {...register('transaction_date')}
              type="date"
              className="flex-1 bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white"
            />
          </div>
        </Card>

        {/* Category Search */}
        <Card className="p-4 mb-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Categoria
          </label>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {displayCategories.map((cat) => {
              const isSelected = watch('category_id') === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue('category_id', cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-income text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  )}
                >
                  <Icon name={cat.icon} className="h-3 w-3 mr-1.5" /> {cat.name}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Account Selection */}
        {accounts?.length ? (
          <Card className="p-4 mb-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              Conta de Destino
            </label>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar">
              {accounts.map((acc) => {
                const isSelected = watch('account_id') === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setValue('account_id', acc.id)}
                    className={cn(
                      'flex-shrink-0 px-4 py-3 rounded-xl transition-all',
                      isSelected 
                        ? 'bg-income/10 ring-2 ring-income' 
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200'
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
          </Card>
        ) : null}

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full bg-income hover:bg-green-600"
          isLoading={isPending}
        >
          <Check className="h-5 w-5 mr-2" />
          Salvar Receita
        </Button>
      </form>

      {/* Custom Numeric Keypad Modal */}
      {showKeypad && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowKeypad(false)}
          />
          <div className="relative w-full bg-white dark:bg-slate-900 p-6 pt-8 rounded-t-[2rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-hidden">
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <button
              type="button"
              onClick={() => setShowKeypad(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">
              Valor da Receita
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
