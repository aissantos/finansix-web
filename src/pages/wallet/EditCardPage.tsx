import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Check, Palette, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreditCard, useUpdateCreditCard, useDeleteCreditCard, useAccounts } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { cn, formatCurrency } from '@/lib/utils';
import { CARD_BRAND_PRESETS, CARD_COLORS_BY_BANK } from '@/lib/presets';

const cardSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  brand: z.string().optional(),
  last_four_digits: z.string().length(4, 'Digite os 4 últimos dígitos').regex(/^\d+$/, 'Apenas números'),
  credit_limit: z.number().positive('Limite deve ser maior que zero'),
  closing_day: z.number().min(1).max(31, 'Dia inválido'),
  due_day: z.number().min(1).max(31, 'Dia inválido'),
  color: z.string().optional(),
  account_id: z.string().optional().nullable(),
});

type CardForm = z.infer<typeof cardSchema>;

export default function EditCardPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [limitDisplay, setLimitDisplay] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS_BY_BANK.default[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: card, isLoading: cardLoading } = useCreditCard(id!);
  const { mutate: updateCard, isPending: isUpdating } = useUpdateCreditCard();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteCreditCard();
  const { data: accounts } = useAccounts();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      name: '',
      brand: '',
      last_four_digits: '',
      credit_limit: 0,
      closing_day: 1,
      due_day: 10,
      color: '',
      account_id: null,
    },
  });

  // Load card data into form
  useEffect(() => {
    if (card) {
      reset({
        name: card.name,
        brand: card.brand || '',
        last_four_digits: card.last_four_digits || '',
        credit_limit: card.credit_limit,
        closing_day: card.closing_day,
        due_day: card.due_day,
        color: card.color || '',
        account_id: card.account_id || null,
      });
      setLimitDisplay(formatCurrency(card.credit_limit).replace('R$', '').trim());
      setSelectedColor(card.color || CARD_COLORS_BY_BANK.default[0]);
    }
  }, [card, reset]);

  const brand = watch('brand');

  // Get bank colors based on card name
  const availableColors = useMemo(() => {
    if (!card) return CARD_COLORS_BY_BANK.default;
    
    const cardName = card.name.toLowerCase();
    for (const [bankId, colors] of Object.entries(CARD_COLORS_BY_BANK)) {
      if (cardName.includes(bankId)) {
        return colors;
      }
    }
    return CARD_COLORS_BY_BANK.default;
  }, [card]);

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setLimitDisplay(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
    setValue('credit_limit', numValue, { shouldDirty: true });
  };

  const onSubmit = (data: CardForm) => {
    if (!id) return;

    updateCard(
      {
        id,
        data: {
          ...data,
          color: selectedColor,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Cartão atualizado!',
            description: `${data.name} foi atualizado com sucesso.`,
            variant: 'success',
          });
          navigate('/wallet');
        },
        onError: () => {
          toast({
            title: 'Erro ao atualizar',
            description: 'Tente novamente.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!id) return;

    deleteCard(id, {
      onSuccess: () => {
        toast({
          title: 'Cartão excluído',
          description: 'O cartão foi removido com sucesso.',
          variant: 'success',
        });
        navigate('/wallet');
      },
      onError: () => {
        toast({
          title: 'Erro ao excluir',
          description: 'Tente novamente.',
          variant: 'destructive',
        });
      },
    });
  };

  if (cardLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
        <PageHeader
          title="Editar Cartão"
          variant="fullscreen"
          showClose
          titleIcon={<CreditCard className="h-5 w-5 text-primary" />}
        />
        <div className="flex-1 px-4 pb-8 space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
        <PageHeader
          title="Cartão não encontrado"
          variant="fullscreen"
          showClose
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Este cartão não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <PageHeader
        title="Editar Cartão"
        variant="fullscreen"
        showClose
        titleIcon={<Sparkles className="h-5 w-5 text-primary" />}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8">
        {/* Card Preview */}
        <div
          className="rounded-2xl p-5 text-white mb-6 relative overflow-hidden shadow-lg"
          style={{ backgroundColor: selectedColor }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
          <div className="flex justify-between items-start mb-8">
            <CreditCard className="h-8 w-8 opacity-80" />
            <span className="text-xs font-bold opacity-70 uppercase">{brand || 'Cartão'}</span>
          </div>
          <p className="text-2xl font-bold tracking-wider mb-2">
            •••• •••• •••• {watch('last_four_digits') || '0000'}
          </p>
          <p className="text-sm font-medium opacity-80">{watch('name') || 'Nome do Cartão'}</p>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <Card className="p-4">
            <label className="label-overline mb-2 block">Nome do Cartão</label>
            <Input
              {...register('name')}
              placeholder="Ex: Nubank, Itaú Platinum"
              error={errors.name?.message}
            />
          </Card>

          {/* Brand Selection */}
          <Card className="p-4">
            <label className="label-overline mb-3 block">Bandeira</label>
            <div className="flex flex-wrap gap-2">
              {CARD_BRAND_PRESETS.map((b) => {
                const isSelected = brand === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setValue('brand', b.id, { shouldDirty: true })}
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
            <label className="label-overline mb-2 block">Últimos 4 Dígitos</label>
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
            <label className="label-overline mb-2 block">Limite de Crédito</label>
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
            <label className="label-overline mb-3 block">Ciclo de Faturamento</label>
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
              <label className="label-overline">Cor do Cartão</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => (
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
              <label className="label-overline mb-3 block">Conta para Débito (Opcional)</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setValue('account_id', null, { shouldDirty: true })}
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
                    onClick={() => setValue('account_id', acc.id, { shouldDirty: true })}
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

          {/* Usage Info */}
          <Card className="p-4 bg-slate-100 dark:bg-slate-800/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="label-overline">Fatura Atual</p>
                <p className="value-display text-expense">{formatCurrency(card.used_limit)}</p>
              </div>
              <div className="text-right">
                <p className="label-overline">Disponível</p>
                <p className="value-display text-income">{formatCurrency(card.available_limit)}</p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              type="submit"
              size="xl"
              className="w-full"
              isLoading={isUpdating}
              disabled={!isDirty}
            >
              <Check className="h-5 w-5 mr-2" />
              Salvar Alterações
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full text-expense border-expense/30 hover:bg-expense/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Cartão
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir cartão?"
        description={`Tem certeza que deseja excluir "${card.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
