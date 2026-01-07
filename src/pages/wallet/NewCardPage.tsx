import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CreditCard, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useCreateCreditCard, useAccounts } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';

const cardSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  brand: z.string().optional(),
  last_four_digits: z.string().length(4, 'Digite os 4 últimos dígitos').regex(/^\d+$/, 'Apenas números'),
  credit_limit: z.number().positive('Limite deve ser maior que zero'),
  closing_day: z.number().min(1).max(31, 'Dia inválido'),
  due_day: z.number().min(1).max(31, 'Dia inválido'),
  color: z.string().optional(),
  account_id: z.string().optional(),
});

type CardForm = z.infer<typeof cardSchema>;

const CARD_BRANDS = [
  { id: 'visa', name: 'Visa', color: '#1A1F71' },
  { id: 'mastercard', name: 'Mastercard', color: '#EB001B' },
  { id: 'elo', name: 'Elo', color: '#00A4E0' },
  { id: 'amex', name: 'Amex', color: '#006FCF' },
  { id: 'hipercard', name: 'Hipercard', color: '#B3131B' },
];

const CARD_COLORS = [
  '#820AD1', // Nubank purple
  '#1A1F71', // Visa blue
  '#EB001B', // Red
  '#00A4E0', // Cyan
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#1E293B', // Slate dark
  '#0EA5E9', // Sky
];

export default function NewCardPage() {
  const navigate = useNavigate();
  const [limitDisplay, setLimitDisplay] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);
  
  const { mutate: createCard, isPending } = useCreateCreditCard();
  const { data: accounts } = useAccounts();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      name: '',
      brand: '',
      last_four_digits: '',
      credit_limit: 0,
      closing_day: 1,
      due_day: 10,
      color: CARD_COLORS[0],
    },
  });

  const cardName = watch('name');
  const lastFour = watch('last_four_digits');
  const brand = watch('brand');
  const closingDay = watch('closing_day');
  const dueDay = watch('due_day');

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setLimitDisplay(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
    setValue('credit_limit', numValue);
  };

  const onSubmit = (data: CardForm) => {
    createCard(
      {
        ...data,
        color: selectedColor,
        is_active: true,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Cartão adicionado!',
            description: `${data.name} foi cadastrado com sucesso.`,
            variant: 'success',
          });
          navigate('/wallet');
        },
        onError: () => {
          toast({
            title: 'Erro ao adicionar cartão',
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
        <h1 className="text-base font-bold text-slate-900 dark:text-white">
          Novo Cartão
        </h1>
        <div className="w-10" />
      </header>

      {/* Card Preview */}
      <div className="px-4 mb-6">
        <div
          className="w-full h-48 rounded-3xl p-5 text-white relative overflow-hidden shadow-lg transition-all duration-300"
          style={{ backgroundColor: selectedColor }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white transform translate-x-10 -translate-y-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white transform -translate-x-10 translate-y-10" />
          </div>
          
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  {brand || 'Bandeira'}
                </p>
                <h3 className="text-lg font-bold mt-0.5">
                  {cardName || 'Nome do Cartão'}
                </h3>
              </div>
              <CreditCard className="h-8 w-8 text-white/80" />
            </div>
            
            <div>
              <p className="text-xl font-mono tracking-widest">
                •••• •••• •••• {lastFour || '0000'}
              </p>
              <div className="flex justify-between items-end mt-3">
                <div>
                  <p className="text-[10px] text-white/60 uppercase">Fecha</p>
                  <p className="text-sm font-bold">Dia {closingDay || '--'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/60 uppercase">Vence</p>
                  <p className="text-sm font-bold">Dia {dueDay || '--'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8 space-y-4">
        {/* Card Name */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Nome do Cartão
          </label>
          <Input
            {...register('name')}
            placeholder="Ex: Nubank, Itaú Platinum"
            error={errors.name?.message}
          />
        </Card>

        {/* Brand Selection */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Bandeira
          </label>
          <div className="flex flex-wrap gap-2">
            {CARD_BRANDS.map((b) => {
              const isSelected = brand === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setValue('brand', b.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  )}
                >
                  {b.name}
                  {isSelected && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Last 4 digits */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Últimos 4 Dígitos
          </label>
          <Input
            {...register('last_four_digits')}
            placeholder="0000"
            maxLength={4}
            inputMode="numeric"
            error={errors.last_four_digits?.message}
          />
        </Card>

        {/* Credit Limit */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Limite de Crédito
          </label>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">R$</span>
            <input
              className="flex-1 text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-300"
              placeholder="0,00"
              value={limitDisplay}
              onChange={handleLimitChange}
              inputMode="numeric"
            />
          </div>
          {errors.credit_limit && (
            <p className="text-xs text-expense mt-1">{errors.credit_limit.message}</p>
          )}
        </Card>

        {/* Billing Dates */}
        <Card className="p-4">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Ciclo de Faturamento
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Dia de Fechamento</label>
              <Input
                type="number"
                {...register('closing_day', { valueAsNumber: true })}
                min={1}
                max={31}
                error={errors.closing_day?.message}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Dia de Vencimento</label>
              <Input
                type="number"
                {...register('due_day', { valueAsNumber: true })}
                min={1}
                max={31}
                error={errors.due_day?.message}
              />
            </div>
          </div>
        </Card>

        {/* Card Color */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-slate-400" />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Cor do Cartão
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {CARD_COLORS.map((color) => (
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

        {/* Link to Account (Optional) */}
        {accounts && accounts.length > 0 && (
          <Card className="p-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              Conta para Débito (Opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setValue('account_id', undefined)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                  !watch('account_id')
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                )}
              >
                Nenhuma
              </button>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setValue('account_id', acc.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all',
                    watch('account_id') === acc.id
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                  )}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="xl"
          className="w-full mt-6"
          isLoading={isPending}
        >
          <Check className="h-5 w-5 mr-2" />
          Salvar Cartão
        </Button>
      </form>
    </div>
  );
}
