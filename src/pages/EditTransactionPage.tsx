import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { TrendingDown, TrendingUp, Calendar, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCategories,
  useCreditCards,
  useAccounts,
} from '@/hooks';
import { toast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';
import type { TransactionType } from '@/types';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category_id: z.string().optional().nullable(),
  credit_card_id: z.string().optional().nullable(),
  account_id: z.string().optional().nullable(),
  transaction_date: z.string(),
  notes: z.string().optional(),
});

type TransactionForm = z.infer<typeof transactionSchema>;

export default function EditTransactionPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [amountDisplay, setAmountDisplay] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: transaction, isLoading: transactionLoading } = useTransaction(id!);
  const { mutate: updateTransaction, isPending: isUpdating } = useUpdateTransaction();
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();
  const { data: categories } = useCategories();
  const { data: cards } = useCreditCards();
  const { data: accounts } = useAccounts();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      description: '',
      category_id: null,
      credit_card_id: null,
      account_id: null,
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  // Load transaction data into form
  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type as TransactionType,
        amount: transaction.amount,
        description: transaction.description,
        category_id: transaction.category_id || null,
        credit_card_id: transaction.credit_card_id || null,
        account_id: transaction.account_id || null,
        transaction_date: transaction.transaction_date,
        notes: transaction.notes || '',
      });
      setAmountDisplay(formatCurrency(transaction.amount).replace('R$', '').trim());
    }
  }, [transaction, reset]);

  const transactionType = watch('type');
  const selectedCategoryId = watch('category_id');

  const filteredCategories = categories?.filter(
    (c) => !c.type || c.type === transactionType
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setAmountDisplay(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
    setValue('amount', numValue, { shouldDirty: true });
  };

  const onSubmit = (data: TransactionForm) => {
    if (!id) return;

    updateTransaction(
      {
        id,
        data: {
          type: data.type as TransactionType,
          amount: data.amount,
          description: data.description,
          category_id: data.category_id,
          credit_card_id: data.credit_card_id,
          account_id: data.account_id,
          transaction_date: data.transaction_date,
          notes: data.notes,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Transação atualizada!',
            description: 'As alterações foram salvas.',
            variant: 'success',
          });
          navigate(-1);
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

    deleteTransaction(id, {
      onSuccess: () => {
        toast({
          title: 'Transação excluída',
          description: 'A transação foi removida.',
          variant: 'success',
        });
        navigate(-1);
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

  if (transactionLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
        <PageHeader title="Editar Transação" variant="fullscreen" showClose />
        <div className="flex-1 px-4 pb-8 space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
        <PageHeader title="Transação não encontrada" variant="fullscreen" showClose />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Esta transação não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  const isInstallment = transaction.is_installment && (transaction.total_installments ?? 0) > 1;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <PageHeader title="Editar Transação" variant="fullscreen" showClose />

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4 pb-8">
        {/* Installment Warning */}
        {isInstallment && (
          <Card className="p-4 mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
            <div className="flex items-center gap-3">
              <Badge variant="warning">
                {transaction.installments?.[0]?.installment_number || 1}/{transaction.total_installments}
              </Badge>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Esta é uma transação parcelada. Alterações afetam apenas esta parcela.
              </p>
            </div>
          </Card>
        )}

        {/* Type Toggle */}
        <div className="bg-slate-200/60 dark:bg-slate-800 p-1.5 rounded-xl flex items-center mb-8">
          <button
            type="button"
            onClick={() => setValue('type', 'expense', { shouldDirty: true })}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all',
              transactionType === 'expense'
                ? 'bg-expense text-white shadow-md'
                : 'text-slate-500'
            )}
          >
            <TrendingDown className="h-4 w-4" />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'income', { shouldDirty: true })}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all',
              transactionType === 'income'
                ? 'bg-income text-white shadow-md'
                : 'text-slate-500'
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Receita
          </button>
        </div>

        {/* Amount */}
        <div className="flex flex-col items-center justify-center mb-10">
          <label className="label-overline mb-2">Valor</label>
          <div className="flex items-baseline gap-1 relative">
            <span className="text-3xl font-medium text-slate-400">R$</span>
            <input
              className="text-5xl font-bold bg-transparent border-none p-0 w-48 text-center focus:ring-0 focus:outline-none text-slate-900 dark:text-white placeholder-slate-200"
              placeholder="0,00"
              value={amountDisplay}
              onChange={handleAmountChange}
              inputMode="numeric"
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-expense mt-2">{errors.amount.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {/* Description */}
          <Card className="p-4">
            <label className="label-overline mb-2 block">Descrição</label>
            <Input
              {...register('description')}
              placeholder="Ex: Almoço, Salário, Uber..."
              error={errors.description?.message}
            />
          </Card>

          {/* Category */}
          <Card className="p-4">
            <label className="label-overline mb-3 block">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {filteredCategories?.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setValue('category_id', cat.id, { shouldDirty: true })}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    )}
                    style={isSelected ? { backgroundColor: cat.color || '#135BEC' } : undefined}
                  >
                    {cat.name}
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Date */}
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-container bg-blue-50 dark:bg-blue-900/20 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="label-overline">Data</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {watch('transaction_date')
                    ? format(new Date(watch('transaction_date') + 'T12:00:00'), 'dd/MM/yyyy')
                    : 'Selecione'}
                </p>
              </div>
            </div>
            <input
              type="date"
              {...register('transaction_date')}
              className="opacity-0 absolute w-full h-full cursor-pointer"
              style={{ left: 0, top: 0 }}
            />
          </Card>

          {/* Payment Method - only for expenses */}
          {transactionType === 'expense' && cards && cards.length > 0 && (
            <Card className="p-4">
              <label className="label-overline mb-3 block">Cartão de Crédito (Opcional)</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setValue('credit_card_id', null, { shouldDirty: true })}
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
                    onClick={() => setValue('credit_card_id', card.id, { shouldDirty: true })}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-bold transition-all',
                      watch('credit_card_id') === card.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                    )}
                  >
                    {card.name}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Account */}
          {accounts && accounts.length > 0 && (
            <Card className="p-4">
              <label className="label-overline mb-3 block">Conta</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setValue('account_id', null, { shouldDirty: true })}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-bold transition-all',
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
                      'px-3 py-2 rounded-xl text-xs font-bold transition-all',
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

          {/* Notes */}
          <Card className="p-4">
            <label className="label-overline mb-2 block">Observações (Opcional)</label>
            <textarea
              {...register('notes')}
              placeholder="Adicione notas ou detalhes..."
              className="w-full h-20 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
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
              Excluir Transação
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir transação?"
        description={`Tem certeza que deseja excluir "${transaction.description}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
