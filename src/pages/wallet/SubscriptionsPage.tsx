import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  X, 
  Check, 
  Plus,
  Repeat,
  Calendar,
  CreditCard,
  Trash2,
  Edit3,
  AlertCircle,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Header, PageContainer } from '@/components/layout';
import { useCreditCards, useSubscriptions, useCreateSubscription, useUpdateSubscription, useDeleteSubscription } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import type { Subscription } from '@/hooks/useSubscriptions';

const subscriptionSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  amount: z.number().positive('Valor deve ser maior que zero'),
  billing_day: z.number().min(1).max(31, 'Dia inválido'),
  credit_card_id: z.string().optional().nullable(),
  category: z.string().optional(),
  icon: z.string().optional(),
  is_active: z.boolean().default(true),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

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

// Popular subscription presets
const POPULAR_SUBSCRIPTIONS = [
  { name: 'Netflix', icon: '🎬', defaultAmount: 55.90, category: 'streaming' },
  { name: 'Spotify', icon: '🎵', defaultAmount: 21.90, category: 'music' },
  { name: 'Amazon Prime', icon: '📦', defaultAmount: 19.90, category: 'streaming' },
  { name: 'Disney+', icon: '🏰', defaultAmount: 43.90, category: 'streaming' },
  { name: 'HBO Max', icon: '🎬', defaultAmount: 34.90, category: 'streaming' },
  { name: 'YouTube Premium', icon: '▶️', defaultAmount: 24.90, category: 'streaming' },
  { name: 'iCloud', icon: '☁️', defaultAmount: 3.50, category: 'cloud' },
  { name: 'Google One', icon: '☁️', defaultAmount: 6.99, category: 'cloud' },
  { name: 'Smart Fit', icon: '💪', defaultAmount: 119.90, category: 'fitness' },
  { name: 'Xbox Game Pass', icon: '🎮', defaultAmount: 44.99, category: 'gaming' },
];

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  
  const { data: subscriptions, isLoading } = useSubscriptions();
  const { data: cards } = useCreditCards();
  const { mutate: deleteSubscription } = useDeleteSubscription();
  const { mutate: updateSubscription } = useUpdateSubscription();

  const totalMonthly = subscriptions?.reduce((sum, s) => sum + (s.is_active ? s.amount : 0), 0) ?? 0;
  const activeCount = subscriptions?.filter(s => s.is_active).length ?? 0;
  const pausedCount = subscriptions?.filter(s => !s.is_active).length ?? 0;

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente excluir a assinatura "${name}"?`)) {
      deleteSubscription(id, {
        onSuccess: () => {
          toast({
            title: 'Assinatura excluída',
            description: `${name} foi removida.`,
            variant: 'success',
          });
        },
      });
    }
  };

  const handleToggleActive = (subscription: Subscription) => {
    updateSubscription(
      { id: subscription.id, is_active: !subscription.is_active },
      {
        onSuccess: () => {
          toast({
            title: subscription.is_active ? 'Assinatura pausada' : 'Assinatura reativada',
            description: `${subscription.name} foi ${subscription.is_active ? 'pausada' : 'reativada'}.`,
            variant: 'success',
          });
        },
      }
    );
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingSubscription(null);
  };

  // Group subscriptions by status
  const activeSubscriptions = subscriptions?.filter(s => s.is_active) ?? [];
  const pausedSubscriptions = subscriptions?.filter(s => !s.is_active) ?? [];

  return (
    <>
      <Header 
        title="Assinaturas" 
        showBack
        onBack={() => navigate('/wallet')}
      />
      <PageContainer className="pb-24">
        {/* Summary Card */}
        <Card className="p-5 mb-6 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                Gasto Mensal
              </p>
              <p className="text-3xl font-black mt-1">
                {formatCurrency(totalMonthly)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex gap-3">
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                    Ativas
                  </p>
                  <p className="text-2xl font-black mt-1">
                    {activeCount}
                  </p>
                </div>
                {pausedCount > 0 && (
                  <div>
                    <p className="text-white/50 text-xs font-medium uppercase tracking-wider">
                      Pausadas
                    </p>
                    <p className="text-xl font-bold mt-1 text-white/60">
                      {pausedCount}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-white/80 text-xs">
              💡 Dica: Revise suas assinaturas periodicamente para evitar gastos desnecessários
            </p>
          </div>
        </Card>

        {/* Add Button */}
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-6"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Assinatura
          </Button>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <SubscriptionForm
            cards={cards}
            editingSubscription={editingSubscription}
            onClose={handleCloseForm}
          />
        )}

        {/* Active Subscriptions */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">
            Assinaturas Ativas ({activeCount})
          </h3>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : activeSubscriptions.length ? (
            activeSubscriptions.map((sub) => (
              <SubscriptionItem
                key={sub.id}
                subscription={sub}
                card={cards?.find(c => c.id === sub.credit_card_id)}
                onEdit={() => handleEdit(sub)}
                onDelete={() => handleDelete(sub.id, sub.name)}
                onToggleActive={() => handleToggleActive(sub)}
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                <Repeat className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-2">Nenhuma assinatura ativa</p>
              <p className="text-xs text-slate-400">
                Adicione suas assinaturas para acompanhar seus gastos recorrentes
              </p>
            </Card>
          )}
        </div>

        {/* Paused Subscriptions */}
        {pausedSubscriptions.length > 0 && (
          <div className="space-y-3 mt-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
              Pausadas ({pausedCount})
            </h3>
            {pausedSubscriptions.map((sub) => (
              <SubscriptionItem
                key={sub.id}
                subscription={sub}
                card={cards?.find(c => c.id === sub.credit_card_id)}
                onEdit={() => handleEdit(sub)}
                onDelete={() => handleDelete(sub.id, sub.name)}
                onToggleActive={() => handleToggleActive(sub)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}

interface SubscriptionItemProps {
  subscription: Subscription;
  card?: { name: string; last_four_digits?: string | null };
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function SubscriptionItem({ subscription, card, onEdit, onDelete, onToggleActive }: SubscriptionItemProps) {
  const today = new Date().getDate();
  const daysUntilBilling = subscription.billing_day >= today
    ? subscription.billing_day - today
    : 30 - today + subscription.billing_day;
  
  const isUpcoming = daysUntilBilling <= 3 && subscription.is_active;

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all',
        subscription.is_active
          ? 'border-slate-100 dark:border-slate-700'
          : 'border-slate-200 dark:border-slate-600 opacity-60'
      )}
    >
      <div className="flex gap-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl">
            {subscription.icon || '📦'}
          </div>
          {isUpcoming && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-500 rounded-full flex items-center justify-center">
              <AlertCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {subscription.name}
              </h4>
              {card && (
                <p className="text-xs text-slate-500 mt-0.5">
                  <CreditCard className="h-3 w-3 inline mr-1" />
                  {card.name} ••{card.last_four_digits}
                </p>
              )}
            </div>
            <p className={cn(
              'font-bold',
              subscription.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-400'
            )}>
              {formatCurrency(subscription.amount)}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-[10px] font-bold px-2 py-1 rounded-full',
                isUpcoming
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
              )}>
                <Calendar className="h-3 w-3 inline mr-1" />
                Dia {subscription.billing_day}
              </span>
              {!subscription.is_active && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-200 text-slate-500">
                  Pausada
                </span>
              )}
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={onToggleActive}
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                  subscription.is_active
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-amber-500'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:text-green-700'
                )}
                title={subscription.is_active ? 'Pausar' : 'Reativar'}
              >
                {subscription.is_active ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={onEdit}
                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SubscriptionFormProps {
  cards?: Array<{ id: string; name: string; last_four_digits?: string | null }>;
  editingSubscription?: Subscription | null;
  onClose: () => void;
}

function SubscriptionForm({ cards, editingSubscription, onClose }: SubscriptionFormProps) {
  const [amountDisplay, setAmountDisplay] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(SUBSCRIPTION_ICONS[0].icon);
  const [showPresets, setShowPresets] = useState(!editingSubscription);
  
  const { mutate: createSubscription, isPending: isCreating } = useCreateSubscription();
  const { mutate: updateSubscription, isPending: isUpdating } = useUpdateSubscription();
  
  const isPending = isCreating || isUpdating;
  const isEditing = !!editingSubscription;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: '',
      amount: 0,
      billing_day: 1,
      is_active: true,
    },
  });

  // Load editing subscription data
  useEffect(() => {
    if (editingSubscription) {
      reset({
        name: editingSubscription.name,
        amount: editingSubscription.amount,
        billing_day: editingSubscription.billing_day,
        credit_card_id: editingSubscription.credit_card_id,
        category: editingSubscription.category,
        is_active: editingSubscription.is_active,
      });
      setSelectedIcon(editingSubscription.icon || '📦');
      setAmountDisplay(formatCurrency(editingSubscription.amount).replace('R$', '').trim());
      setShowPresets(false);
    }
  }, [editingSubscription, reset]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setAmountDisplay(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
    setValue('amount', numValue);
  };

  const handlePresetSelect = (preset: typeof POPULAR_SUBSCRIPTIONS[0]) => {
    setValue('name', preset.name);
    setValue('amount', preset.defaultAmount);
    setValue('category', preset.category);
    setSelectedIcon(preset.icon);
    setAmountDisplay(formatCurrency(preset.defaultAmount).replace('R$', '').trim());
    setShowPresets(false);
  };

  const onSubmit = (data: SubscriptionFormData) => {
    const payload = {
      name: data.name,
      amount: data.amount,
      billing_day: data.billing_day,
      icon: selectedIcon,
      category: data.category || undefined,
      credit_card_id: data.credit_card_id || undefined,
      is_active: data.is_active,
    };

    if (isEditing && editingSubscription) {
      updateSubscription(
        { id: editingSubscription.id, ...payload },
        {
          onSuccess: () => {
            toast({
              title: 'Assinatura atualizada!',
              description: `${data.name} foi atualizada.`,
              variant: 'success',
            });
            onClose();
          },
          onError: (error) => {
            console.error('Update error:', error);
            toast({
              title: 'Erro ao atualizar',
              description: error instanceof Error ? error.message : 'Tente novamente.',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      createSubscription(payload, {
        onSuccess: () => {
          toast({
            title: 'Assinatura adicionada!',
            description: `${data.name} foi cadastrada.`,
            variant: 'success',
          });
          onClose();
        },
        onError: (error) => {
          console.error('Create error:', error);
          toast({
            title: 'Erro ao adicionar',
            description: error instanceof Error ? error.message : 'Tente novamente.',
            variant: 'destructive',
          });
        },
      });
    }
  };

  return (
    <Card className="p-4 mb-6 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Editar Assinatura' : 'Nova Assinatura'}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Popular Presets */}
      {showPresets && !isEditing && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Populares
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SUBSCRIPTIONS.slice(0, 6).map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowPresets(false)}
            className="text-xs text-primary font-medium mt-2 hover:underline"
          >
            Ou preencha manualmente
          </button>
        </div>
      )}

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
              Cartão de Cobrança (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setValue('credit_card_id', null)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold transition-all',
                  !watch('credit_card_id')
                    ? 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                )}
              >
                Nenhum
              </button>
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
            {isEditing ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
