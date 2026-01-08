import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  X, 
  Check, 
  Palette, 
  Landmark, 
  PiggyBank, 
  Wallet, 
  DollarSign,
  TrendingUp,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAccount, useUpdateAccount, useDeleteAccount } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import type { AccountType } from '@/types';

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

export default function EditAccountPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { data: account, isLoading } = useAccount(id!);
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateAccount();
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [balance, setBalance] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Carregar dados da conta
  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type as AccountType);
      setColor(account.color || ACCOUNT_COLORS[0]);
      setBalance(formatCurrency(account.current_balance ?? 0).replace('R$', '').trim());
    }
  }, [account]);

  const selectedType = ACCOUNT_TYPES.find(t => t.id === type);

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setBalance(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: 'Digite um nome', variant: 'destructive' });
      return;
    }

    const numBalance = parseFloat(balance.replace(/\./g, '').replace(',', '.')) || 0;

    updateAccount(
      { 
        id: id!, 
        data: { 
          name: name.trim(), 
          type, 
          color,
          current_balance: numBalance,
        } 
      },
      {
        onSuccess: () => {
          toast({ title: 'Conta atualizada!', variant: 'success' });
          navigate('/wallet');
        },
        onError: () => {
          toast({ title: 'Erro ao atualizar', variant: 'destructive' });
        },
      }
    );
  };

  const handleDelete = () => {
    deleteAccount(id!, {
      onSuccess: () => {
        toast({ title: 'Conta excluída', variant: 'success' });
        navigate('/wallet');
      },
      onError: () => {
        toast({ title: 'Erro ao excluir', variant: 'destructive' });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-12 w-12 rounded-xl bg-primary animate-pulse" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500">Conta não encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-20">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 shadow-sm"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          Editar Conta
        </h1>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-500"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </header>

      {/* Account Preview */}
      <div className="px-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              {selectedType?.icon || <Wallet className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {name || 'Nome da Conta'}
              </h3>
              <p className="text-sm text-slate-500">
                {selectedType?.name || 'Tipo de conta'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Saldo</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                R$ {balance || '0,00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 pb-8 space-y-4">
        {/* Account Type */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Tipo de Conta
          </label>
          <div className="space-y-2">
            {ACCOUNT_TYPES.map((t) => {
              const isSelected = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
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
                    {t.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(
                      'font-bold text-sm',
                      isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'
                    )}>
                      {t.name}
                    </h4>
                    <p className="text-xs text-slate-500">{t.description}</p>
                  </div>
                  {isSelected && <Check className="h-5 w-5 text-primary" />}
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Nubank, Itaú, Carteira"
          />
        </Card>

        {/* Current Balance */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Saldo Atual
          </label>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-slate-400">R$</span>
            <input
              className="flex-1 text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-300"
              placeholder="0,00"
              value={balance}
              onChange={handleBalanceChange}
              inputMode="numeric"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            ⚠️ Alterar o saldo manualmente pode causar inconsistências com as transações registradas
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
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  'h-10 w-10 rounded-xl transition-all',
                  color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="h-5 w-5 text-white mx-auto" />}
              </button>
            ))}
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full mt-6"
          isLoading={isUpdating}
        >
          <Check className="h-5 w-5 mr-2" />
          Salvar Alterações
        </Button>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Excluir Conta?
                </h3>
                <p className="text-sm text-slate-500">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              A conta <strong>"{account.name}"</strong> será excluída. 
              As transações associadas serão mantidas, mas ficarão sem conta vinculada.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                isLoading={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
