import { useState } from 'react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Calendar, 
  CreditCard, 
  Receipt,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';

interface InstallmentConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalAmount: number;
  installments: number;
  description: string;
  cardName?: string;
  startDate?: Date;
  isLoading?: boolean;
}

export function InstallmentConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  installments,
  description,
  cardName,
  startDate = new Date(),
  isLoading = false,
}: InstallmentConfirmDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const installmentAmount = totalAmount / installments;
  
  // Gerar preview das parcelas
  const installmentPreview = Array.from({ length: installments }, (_, i) => {
    const date = addMonths(startDate, i);
    return {
      number: i + 1,
      date,
      amount: installmentAmount,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <Card className="max-w-md w-full p-0 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 border-b border-amber-100 dark:border-amber-800">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Confirmar Parcelamento
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Esta ação criará {installments} lançamentos futuros
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Descrição</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[200px]">
                {description}
              </span>
            </div>
            
            {cardName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  Cartão
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                  {cardName}
                </span>
              </div>
            )}

            <div className="h-px bg-slate-200 dark:bg-slate-700" />

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Valor Total</span>
              <span className="font-black text-lg text-slate-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Parcelas</span>
              <span className="font-bold text-primary">
                {installments}x de {formatCurrency(installmentAmount)}
              </span>
            </div>
          </div>

          {/* Installments Preview */}
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Ver cronograma de parcelas
              </span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showDetails && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                {installmentPreview.map((item, index) => (
                  <div
                    key={item.number}
                    className={cn(
                      'flex items-center justify-between p-3 text-sm',
                      index !== installmentPreview.length - 1 && 'border-b border-slate-100 dark:border-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                        item.number === 1 
                          ? 'bg-primary text-white' 
                          : item.number === installments
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      )}>
                        {item.number}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {format(item.date, "MMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            <Receipt className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              As parcelas serão criadas automaticamente e aparecerão nas faturas dos próximos meses.
              Você poderá editar ou excluir cada parcela individualmente.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar {installments}x
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Hook para gerenciar o estado do dialog
 */
export function useInstallmentConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingData, setPendingData] = useState<{
    totalAmount: number;
    installments: number;
    description: string;
    cardName?: string;
    onConfirm: () => void;
  } | null>(null);

  const openConfirm = (data: typeof pendingData) => {
    setPendingData(data);
    setIsOpen(true);
  };

  const closeConfirm = () => {
    setIsOpen(false);
    setPendingData(null);
  };

  const handleConfirm = () => {
    pendingData?.onConfirm();
    closeConfirm();
  };

  return {
    isOpen,
    pendingData,
    openConfirm,
    closeConfirm,
    handleConfirm,
  };
}
