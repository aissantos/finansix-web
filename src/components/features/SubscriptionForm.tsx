import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useCreateSubscription, useUpdateSubscription } from '@/hooks/useSubscriptions';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import type { Tables } from '@/types/database';

const subscriptionSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  amount: z.number().positive('Valor deve ser maior que zero'),
  billing_day: z.number().min(1).max(31, 'Dia inválido'),
  credit_card_id: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  icon: z.string().optional(),
  is_active: z.boolean().default(true),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

const SUBSCRIPTION_ICONS = [
  { id: 'streaming', icon: '🎬', name: 'Streaming' },
  { id: 'music', icon: '🎵', name: 'Música' },
  { id: 'gaming', icon: '🎮', name: 'Jogos' },
  { id: 'fitness', icon: '💪', name: 'Fitness' },
  { id: 'cloud', icon: '☁️', name: 'Cloud' },
  { id: 'news', icon: '📰', name: 'Notícias' },
  { id: 'education', icon: '📚', name: 'Educação' },
  { id: 'software', icon: '💻', name: 'Software' },
  { id: 'food', icon: '🍔', name: 'Delivery' },
  { id: 'other', icon: '📦', name: 'Outro' },
];

interface SubscriptionFormProps {
  cards?: Tables<'credit_cards'>[];
  initialData?: Partial<SubscriptionFormValues> & { id?: string };
  onClose: () => void;
}

export function SubscriptionForm({ cards, initialData, onClose }: SubscriptionFormProps) {
  const [amountDisplay, setAmountDisplay] = useState(
    initialData?.amount ? formatCurrency(initialData.amount).replace('R$', '').trim() : ''
  );
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || SUBSCRIPTION_ICONS[0].icon);
  
  const { mutate: createSubscription, isPending: isCreating } = useCreateSubscription();
  const { mutate: updateSubscription, isPending: isUpdating } = useUpdateSubscription();

  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: initialData?.name || '',
      amount: initialData?.amount || 0,
      billing_day: initialData?.billing_day || 1,
      credit_card_id: initialData?.credit_card_id || null,
      is_active: initialData?.is_active ?? true,
      icon: initialData?.icon || SUBSCRIPTION_ICONS[0].icon,
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setAmountDisplay(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
    setValue('amount', numValue);
  };

  const onSubmit = (data: SubscriptionFormValues) => {
    const payload = {
      ...data,
      icon: selectedIcon,
    };

    const onSuccess = () => {
      toast({
        title: initialData?.id ? 'Assinatura atualizada!' : 'Assinatura adicionada!',
        description: `${data.name} foi salva com sucesso.`,
        variant: 'success',
      });
      onClose();
    };

    const onError = () => {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    };

    if (initialData?.id) {
        updateSubscription({ id: initialData.id, ...payload }, { onSuccess, onError });
    } else {
        createSubscription(payload, { onSuccess, onError });
    }
  };

  return (
    <Card className="p-4 mb-6 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">
          {initialData?.id ? 'Editar Assinatura' : 'Nova Assinatura'}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Icon Selection */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Ícone
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBSCRIPTION_ICONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIcon(item.icon)}
                className={cn(
                  'h-10 w-10 rounded-xl text-lg transition-all',
                  selectedIcon === item.icon
                    ? 'bg-primary/10 ring-2 ring-primary'
                    : 'bg-slate-100 dark:bg-slate-700'
                )}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Nome
          </label>
          <Input
            {...register('name')}
            placeholder="Ex: Netflix, Spotify, Academia"
            error={errors.name?.message}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Valor Mensal
          </label>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
            <span className="text-slate-400 font-medium">R$</span>
            <input
              className="flex-1 text-xl font-bold bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-300"
              placeholder="0,00"
              value={amountDisplay}
              onChange={handleAmountChange}
              inputMode="numeric"
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-expense mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Billing Day */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            Dia de Cobrança
          </label>
          <Input
            type="number"
            {...register('billing_day', { valueAsNumber: true })}
            min={1}
            max={31}
            error={errors.billing_day?.message}
          />
        </div>

        {/* Card Selection */}
        {cards && cards.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
              Cartão de Cobrança
            </label>
            <div className="flex flex-wrap gap-2">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setValue('credit_card_id', card.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-bold transition-all',
                    watch('credit_card_id') === card.id
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                  )}
                >
                  {card.name} ••{card.last_four_digits}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" isLoading={isPending}>
            <Check className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </form>
    </Card>
  );
}