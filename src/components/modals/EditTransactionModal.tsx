/**
 * EDIT TRANSACTION MODAL
 * Modal inline para edição rápida de transações
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { X, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategories, useUpdateTransaction } from '@/hooks';
import { toast } from '@/hooks/useToast';
import type { TransactionWithDetails } from '@/types';

const schema = z.object({
  description: z.string().min(1, 'Descrição obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  category_id: z.string().optional(),
  transaction_date: z.string(),
});

type FormData = z.infer<typeof schema>;

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithDetails | null;
}

export function EditTransactionModal({
  isOpen,
  onClose,
  transaction,
}: EditTransactionModalProps) {
  const { data: categories } = useCategories();
  const updateMutation = useUpdateTransaction();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (transaction) {
      reset({
        description: transaction.description,
        amount: transaction.amount,
        category_id: transaction.category_id || '',
        transaction_date: format(new Date(transaction.transaction_date), 'yyyy-MM-dd'),
      });
    }
  }, [transaction, reset]);

  const onSubmit = async (data: FormData) => {
    if (!transaction) return;

    try {
      await updateMutation.mutateAsync({
        id: transaction.id,
        updates: {
          description: data.description,
          amount: data.amount,
          category_id: data.category_id || null,
          transaction_date: data.transaction_date,
        },
      });

      toast({
        title: 'Transação atualizada',
        description: 'As alterações foram salvas com sucesso',
        variant: 'success',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Editar Transação
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              Descrição
            </label>
            <Input
              {...register('description')}
              placeholder="Ex: Compras no supermercado"
              error={errors.description?.message}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              Valor
            </label>
            <Input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="0,00"
              error={errors.amount?.message}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              Categoria
            </label>
            <select
              {...register('category_id')}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Sem categoria</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
              Data
            </label>
            <Input
              {...register('transaction_date')}
              type="date"
              error={errors.transaction_date?.message}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!isDirty || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
