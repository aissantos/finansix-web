import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  X, 
  Check, 
  Palette, 
  Landmark, 
  PiggyBank, 
  Wallet, 
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useCreateAccount } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import type { AccountType } from '@/types';

const accountSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['checking', 'savings', 'investment', 'cash']),
  initial_balance: z.number(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type AccountForm = z.infer<typeof accountSchema>;

const ACCOUNT_TYPES: { id: AccountType; name: string; icon: React.ReactNode; description: string }[] = [
  { 
    id: 'checking', 
    name: 'Conta Corrente', 
    icon: <Landmark className="h-5 w-5" />,
    description: 'Conta bancária principal',
  },
  { 
    id: 'savings', 
    name: 'Poupança', 
    icon: <PiggyBank className="h-5 w-5" />,
    description: 'Reserva de emergência',
  },
  { 
    id: 'investment', 
    name: 'Investimento', 
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'Corretora ou fundo',
  },
  { 
    id: 'cash', 
    name: 'Dinheiro', 
    icon: <DollarSign className="h-5 w-5" />,
    description: 'Carteira física',
  },
];

const ACCOUNT_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#84CC16', // Lime
  '#1E293B', // Slate dark
  '#0EA5E9', // Sky
];

export default function NewAccountPage() {
  const navigate = useNavigate();
  const [balanceDisplay, setBalanceDisplay] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [isNegative, setIsNegative] = useState(false);
  
  const { mutate: createAccount, isPending } = useCreateAccount();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'checking',
      initial_balance: 0,
      color: ACCOUNT_COLORS[0],
    },
  });

  const accountType = watch('type');
  const accountName = watch('name');

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setBalanceDisplay(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
    setValue('initial_balance', isNegative ? -numValue : numValue);
  };

  const toggleNegative = () => {
    const currentBalance = watch('initial_balance');
    setIsNegative(!isNegative);
    setValue('initial_balance', -currentBalance);
  };

  const onSubmit = (data: AccountForm) => {
    createAccount(
      {
        ...data,
        color: selectedColor,
        is_active: true,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Conta adicionada!',
            description: `${data.name} foi cadastrada com sucesso.`,
            variant: 'success',
          });
          navigate('/wallet');
        },
        onError: () => {
          toast({
            title: 'Erro ao adicionar conta',
            description: 'Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const selectedType = ACCOUNT_TYPES.find(t => t.id === accountType);

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
          Nova Conta
        </h1>
        <div className="w-10" />
      </header>

      {/* Account Preview */}
      <div className="px-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: selectedColor }}
            >
              {selectedType?.icon || <Wallet className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {accountName || 'Nome da Conta'}
              </h3>
              <p className="text-sm text-slate-500">
                {selectedType?.name || 'Tipo de conta'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Saldo</p>
              <p className={cn(
                'text-xl font-bold',
                isNegative ? 'text-expense' : 'text-income'
              )}>
                {balanceDisplay ? `R$ ${isNegative ? '-' : ''}${balanceDisplay}` : 'R$ 0,00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8 space-y-4">
        {/* Account Type */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Tipo de Conta
          </label>
          <div className="space-y-2">
            {ACCOUNT_TYPES.map((type) => {
              const isSelected = accountType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setValue('type', type.id)}
                  className={cn(
                    'w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'
                  )}
                >
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center',
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  )}>
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(
                      'font-bold text-sm',
                      isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'
                    )}>
                      {type.name}
                    </h4>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Account Name */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Nome da Conta
          </label>
          <Input
            {...register('name')}
            placeholder="Ex: Nubank, Itaú, Carteira"
            error={errors.name?.message}
          />
        </Card>

        {/* Initial Balance */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Saldo Inicial
            </label>
            <button
              type="button"
              onClick={toggleNegative}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                isNegative
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/20'
                  : 'bg-green-100 text-green-600 dark:bg-green-900/20'
              )}
            >
              {isNegative ? 'Negativo' : 'Positivo'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-lg font-medium',
              isNegative ? 'text-expense' : 'text-slate-400'
            )}>
              {isNegative ? '-' : ''} R$
            </span>
            <input
              className="flex-1 text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-300"
              placeholder="0,00"
              value={balanceDisplay}
              onChange={handleBalanceChange}
              inputMode="numeric"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Informe o saldo atual da conta para começarmos a registrar
          </p>
        </Card>

        {/* Account Color */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-slate-400" />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Cor da Conta
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={cn(
                  'h-10 w-10 rounded-xl transition-all',
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                )}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <Check className="h-5 w-5 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full mt-6"
          isLoading={isPending}
        >
          <Check className="h-5 w-5 mr-2" />
          Salvar Conta
        </Button>
      </form>
    </div>
  );
}
