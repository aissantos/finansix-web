import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Check, Search, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useCreateSubscription, useUpdateSubscription } from '@/hooks/useSubscriptions';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  SUBSCRIPTION_PRESETS, 
  SUBSCRIPTION_CATEGORIES,
  searchSubscriptions,
  type SubscriptionPreset 
} from '@/lib/presets';
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

interface SubscriptionFormProps {
  cards?: Tables<'credit_cards'>[];
  initialData?: Partial<SubscriptionFormValues> & { id?: string };
  onClose: () => void;
}

export function SubscriptionForm({ cards, initialData, onClose }: SubscriptionFormProps) {
  const [step, setStep] = useState<'presets' | 'form'>(initialData?.id ? 'form' : 'presets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amountDisplay, setAmountDisplay] = useState(
    initialData?.amount ? formatCurrency(initialData.amount).replace('R$', '').trim() : ''
  );
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || '📦');
  
  const { mutate: createSubscription, isPending: isCreating } = useCreateSubscription();
  const { mutate: updateSubscription, isPending: isUpdating } = useUpdateSubscription();

  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: initialData?.name || '',
      amount: initialData?.amount || 0,
      billing_day: initialData?.billing_day || 1,
      credit_card_id: initialData?.credit_card_id || null,
      category: initialData?.category || null,
      is_active: initialData?.is_active ?? true,
      icon: initialData?.icon || '📦',
    },
  });

  // Presets filtrados
  const filteredPresets = useMemo(() => {
    if (searchQuery) {
      return searchSubscriptions(searchQuery);
    }
    if (selectedCategory) {
      return SUBSCRIPTION_PRESETS[selectedCategory] || [];
    }
    return [];
  }, [searchQuery, selectedCategory]);

  // Popular presets para mostrar inicialmente
  const popularPresets = useMemo(() => {
    return [
      ...SUBSCRIPTION_PRESETS.streaming.slice(0, 3),
      ...SUBSCRIPTION_PRESETS.music.slice(0, 2),
      ...SUBSCRIPTION_PRESETS.ai.slice(0, 3),
    ];
  }, []);

  const handlePresetSelect = (preset: SubscriptionPreset) => {
    reset({
      name: preset.name,
      amount: preset.defaultAmount,
      billing_day: 1,
      credit_card_id: null,
      category: preset.category,
      is_active: true,
    });
    setSelectedIcon(preset.icon);
    setAmountDisplay(formatCurrency(preset.defaultAmount).replace('R$', '').trim());
    setStep('form');
  };

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

  // ============================================================================
  // STEP 1: Seleção de Presets
  // ============================================================================
  if (step === 'presets') {
    return (
      <Card className="p-4 mb-6 border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-slate-900 dark:text-white">Nova Assinatura</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar serviço..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedCategory(null);
            }}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-4">
            {filteredPresets.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {filteredPresets.map((preset) => (
                  <PresetButton
                    key={preset.name}
                    preset={preset}
                    onClick={() => handlePresetSelect(preset)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                Nenhum serviço encontrado. 
                <button 
                  onClick={() => { setSearchQuery(''); setStep('form'); }}
                  className="text-primary font-medium ml-1"
                >
                  Cadastrar manualmente
                </button>
              </p>
            )}
          </div>
        )}

        {/* Categories */}
        {!searchQuery && !selectedCategory && (
          <>
            {/* Popular */}
            <div className="mb-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Populares
              </label>
              <div className="grid grid-cols-2 gap-2">
                {popularPresets.map((preset) => (
                  <PresetButton
                    key={preset.name}
                    preset={preset}
                    onClick={() => handlePresetSelect(preset)}
                    compact
                  />
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Categorias
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUBSCRIPTION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">
                      {cat.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Category Presets */}
        {!searchQuery && selectedCategory && (
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 text-sm text-primary mb-3"
            >
              ← Voltar
            </button>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {filteredPresets.map((preset) => (
                <PresetButton
                  key={preset.name}
                  preset={preset}
                  onClick={() => handlePresetSelect(preset)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Manual Entry */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setStep('form')}
            className="w-full py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            Ou cadastre manualmente →
          </button>
        </div>
      </Card>
    );
  }

  // ============================================================================
  // STEP 2: Formulário
  // ============================================================================
  return (
    <Card className="p-4 mb-6 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {!initialData?.id && (
            <button
              onClick={() => setStep('presets')}
              className="text-slate-400 hover:text-slate-600"
            >
              ←
            </button>
          )}
          <h3 className="font-bold text-slate-900 dark:text-white">
            {initialData?.id ? 'Editar Assinatura' : 'Detalhes'}
          </h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
          <span className="text-3xl">{selectedIcon}</span>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white">
              {watch('name') || 'Nome da assinatura'}
            </p>
            <p className="text-sm text-slate-500">
              {amountDisplay ? `R$ ${amountDisplay}/mês` : 'R$ 0,00/mês'}
            </p>
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
              <button
                type="button"
                onClick={() => setValue('credit_card_id', null)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold transition-all',
                  !watch('credit_card_id')
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
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
                  {card.name} {card.last_four_digits && `••${card.last_four_digits}`}
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

// ============================================================================
// Preset Button Component
// ============================================================================

function PresetButton({ 
  preset, 
  onClick,
  compact = false 
}: { 
  preset: SubscriptionPreset; 
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left group",
        compact ? "p-2" : "p-3"
      )}
    >
      <span className={cn("flex-shrink-0", compact ? "text-xl" : "text-2xl")}>
        {preset.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-slate-900 dark:text-white truncate",
          compact ? "text-xs" : "text-sm"
        )}>
          {preset.name}
        </p>
        {!compact && (
          <p className="text-xs text-slate-500">
            {formatCurrency(preset.defaultAmount)}/mês
          </p>
        )}
      </div>
      {compact && (
        <span className="text-[10px] text-slate-400 font-medium">
          {formatCurrency(preset.defaultAmount)}
        </span>
      )}
    </button>
  );
}
