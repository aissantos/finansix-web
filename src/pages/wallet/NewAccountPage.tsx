import { useState, useMemo } from 'react';
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
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useCreateAccount } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import { 
 
  searchBanks,
  getBanksByType,
  type BankPreset 
} from '@/lib/presets';
import type { AccountType } from '@/types';

const accountSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  type: z.enum(['checking', 'savings', 'investment', 'cash']),
  initial_balance: z.number(),
  color: z.string().optional(),
  icon: z.string().optional(),
  // Campos bancários opcionais
  bank_code: z.string().optional(),
  bank_name: z.string().optional(),
  branch_number: z.string().optional(),
  account_number: z.string().optional(),
  account_digit: z.string().optional(),
  pix_key: z.string().optional(),
  pix_key_type: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional(),
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
  '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6',
  '#06B6D4', '#EF4444', '#84CC16', '#1E293B', '#0EA5E9',
];

export default function NewAccountPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'bank' | 'form'>('bank');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankPreset | null>(null);
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
      bank_code: '',
      bank_name: '',
      branch_number: '',
      account_number: '',
      account_digit: '',
      pix_key: '',
    },
  });

  const accountType = watch('type');
  const accountName = watch('name');

  const filteredBanks = useMemo(() => {
    if (searchQuery) return searchBanks(searchQuery);
    return [];
  }, [searchQuery]);

  const handleBankSelect = (bank: BankPreset) => {
    setSelectedBank(bank);
    setValue('name', bank.name);
    setSelectedColor(bank.color);
    setValue('type', bank.type === 'investment' ? 'investment' : 'checking');
    setStep('form');
  };

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
      { ...data, color: selectedColor, is_active: true },
      {
        onSuccess: () => {
          toast({ title: 'Conta adicionada!', description: `${data.name} foi cadastrada com sucesso.`, variant: 'success' });
          navigate('/wallet');
        },
        onError: () => {
          toast({ title: 'Erro ao adicionar conta', description: 'Tente novamente.', variant: 'destructive' });
        },
      }
    );
  };

  const selectedType = ACCOUNT_TYPES.find(t => t.id === accountType);

  // STEP 1: Seleção de Banco
  if (step === 'bank') {
    const digitalBanks = getBanksByType('digital');
    const traditionalBanks = getBanksByType('traditional');
    const investmentBanks = getBanksByType('investment');

    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-20">
          <button onClick={() => navigate(-1)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 shadow-sm">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Nova Conta</h1>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 px-4 pb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar banco..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {searchQuery ? (
            <div className="space-y-2">
              {filteredBanks.length > 0 ? (
                filteredBanks.map((bank) => (
                  <BankButton key={bank.id} bank={bank} onClick={() => handleBankSelect(bank)} />
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhum banco encontrado.
                  <button onClick={() => { setSearchQuery(''); setStep('form'); }} className="text-primary font-medium ml-1">
                    Cadastrar manualmente
                  </button>
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">💵 Outras Opções</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setValue('name', 'Carteira'); setValue('type', 'cash'); setSelectedColor('#10B981'); setStep('form'); }} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all">
                    <div className="h-8 w-8 rounded-xl bg-green-500 flex items-center justify-center"><DollarSign className="h-4 w-4 text-white" /></div>
                    <span className="text-xs font-medium">Dinheiro</span>
                  </button>
                  <button onClick={() => { setValue('name', 'Poupança'); setValue('type', 'savings'); setSelectedColor('#F59E0B'); setStep('form'); }} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all">
                    <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center"><PiggyBank className="h-4 w-4 text-white" /></div>
                    <span className="text-xs font-medium">Poupança</span>
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">🏦 Bancos Digitais</label>
                <div className="grid grid-cols-2 gap-2">
                  {digitalBanks.slice(0, 6).map((bank) => (<BankButton key={bank.id} bank={bank} onClick={() => handleBankSelect(bank)} compact />))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">🏛️ Bancos Tradicionais</label>
                <div className="grid grid-cols-2 gap-2">
                  {traditionalBanks.slice(0, 6).map((bank) => (<BankButton key={bank.id} bank={bank} onClick={() => handleBankSelect(bank)} compact />))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">📈 Corretoras</label>
                <div className="grid grid-cols-2 gap-2">
                  {investmentBanks.slice(0, 4).map((bank) => (<BankButton key={bank.id} bank={bank} onClick={() => handleBankSelect(bank)} compact />))}
                </div>
              </div>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <button onClick={() => setStep('form')} className="w-full py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
              Ou cadastre manualmente →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Formulário
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-20">
        <button onClick={() => setStep('bank')} className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 shadow-sm">
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">{selectedBank ? selectedBank.name : 'Nova Conta'}</h1>
        <div className="w-10" />
      </header>

      <div className="px-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: selectedColor }}>
              {selectedType?.icon || <Wallet className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{accountName || 'Nome da Conta'}</h3>
              <p className="text-sm text-slate-500">{selectedType?.name || 'Tipo de conta'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Saldo</p>
              <p className={cn('text-xl font-bold', isNegative ? 'text-expense' : 'text-income')}>
                {balanceDisplay ? `R$ ${isNegative ? '-' : ''}${balanceDisplay}` : 'R$ 0,00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8 space-y-4">
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Tipo de Conta</label>
          <div className="space-y-2">
            {ACCOUNT_TYPES.map((type) => {
              const isSelected = accountType === type.id;
              return (
                <button key={type.id} type="button" onClick={() => setValue('type', type.id)} className={cn('w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left', isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800')}>
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')}>{type.icon}</div>
                  <div className="flex-1">
                    <h4 className={cn('font-bold text-sm', isSelected ? 'text-primary' : 'text-slate-900 dark:text-white')}>{type.name}</h4>
                    <p className="text-xs text-slate-500">{type.description}</p>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Nome da Conta</label>
          <Input {...register('name')} placeholder="Ex: Nubank, Itaú, Carteira" error={errors.name?.message} />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Saldo Inicial</label>
            <button type="button" onClick={toggleNegative} className={cn('px-3 py-1 rounded-lg text-xs font-bold transition-all', isNegative ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : 'bg-green-100 text-green-600 dark:bg-green-900/20')}>
              {isNegative ? 'Negativo' : 'Positivo'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-lg font-medium', isNegative ? 'text-expense' : 'text-slate-400')}>{isNegative ? '-' : ''} R$</span>
            <input className="flex-1 text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-300" placeholder="0,00" value={balanceDisplay} onChange={handleBalanceChange} inputMode="numeric" />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Informe o saldo atual da conta para começarmos a registrar</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-slate-400" />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cor da Conta</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((color) => (
              <button key={color} type="button" onClick={() => setSelectedColor(color)} className={cn('h-10 w-10 rounded-xl transition-all', selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : '')} style={{ backgroundColor: color }}>
                {selectedColor === color && <Check className="h-5 w-5 text-white mx-auto" />}
              </button>
            ))}
          </div>
        </Card>

        {/* Dados Bancários - Só aparecem para contas corrente, poupança ou investimento */}
        {(accountType === 'checking' || accountType === 'savings' || accountType === 'investment') && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="h-4 w-4 text-slate-400" />
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dados Bancários (Opcional)</label>
            </div>
            
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Banco</label>
              <Input 
                {...register('bank_name')} 
                placeholder="Ex: Nubank, Itaú, Bradesco" 
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs text-slate-500 mb-1.5">Código</label>
                <Input 
                  {...register('bank_code')} 
                  placeholder="260"
                  maxLength={10}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1.5">Agência</label>
                <Input 
                  {...register('branch_number')} 
                  placeholder="0001"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1.5">Conta</label>
                <Input 
                  {...register('account_number')} 
                  placeholder="12345678"
                  maxLength={30}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-slate-500 mb-1.5">Dígito</label>
                <Input 
                  {...register('account_digit')} 
                  placeholder="9"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
              <label className="block text-xs text-slate-500 mb-1.5">Chave PIX (Opcional)</label>
              <div className="space-y-2">
                <select
                  {...register('pix_key_type')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                >
                  <option value="">Tipo de chave</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
                <Input 
                  {...register('pix_key')} 
                  placeholder="Chave PIX (CPF, e-mail, telefone...)"
                />
              </div>
            </div>
          </Card>
        )}

        <Button type="submit" size="xl" className="w-full mt-6" isLoading={isPending}>
          <Check className="h-5 w-5 mr-2" />
          Salvar Conta
        </Button>
      </form>
    </div>
  );
}

function BankButton({ bank, onClick, compact = false }: { bank: BankPreset; onClick: () => void; compact?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all text-left", compact ? "p-3" : "p-4")}>
      <div className={cn("rounded-xl flex items-center justify-center text-white font-bold", compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm")} style={{ backgroundColor: bank.color }}>
        {bank.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-slate-900 dark:text-white truncate", compact ? "text-xs" : "text-sm")}>{bank.name}</p>
        {!compact && <p className="text-xs text-slate-500 capitalize">{bank.type === 'digital' ? 'Digital' : bank.type === 'traditional' ? 'Tradicional' : 'Corretora'}</p>}
      </div>
    </button>
  );
}
