import { useState } from 'react';
import { X, Check, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PaymentType = 'full' | 'partial' | 'minimum';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, paymentType: PaymentType) => Promise<void>;
  title: string;
  totalAmount: number;
  minimumAmount?: number;
  dueDate?: Date;
  isLoading?: boolean;
  allowPartial?: boolean;
  itemType: 'bill' | 'invoice'; // bill = conta a pagar, invoice = fatura cartão
}

export function PaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  totalAmount,
  minimumAmount,
  dueDate,
  isLoading = false,
  allowPartial = false,
  itemType,
}: PaymentDialogProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [customAmount, setCustomAmount] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numValue = Number(value) / 100;
    setAmountDisplay(numValue > 0 ? formatCurrency(numValue).replace('R$', '').trim() : '');
    setCustomAmount(numValue.toString());
  };

  const getPaymentAmount = (): number => {
    switch (paymentType) {
      case 'full':
        return totalAmount;
      case 'minimum':
        return minimumAmount ?? totalAmount * 0.15; // 15% mínimo padrão
      case 'partial':
        return parseFloat(customAmount) || 0;
    }
  };

  const handleConfirm = async () => {
    const amount = getPaymentAmount();
    if (amount <= 0) return;
    await onConfirm(amount, paymentType);
    onClose();
  };

  const isOverdue = dueDate && new Date(dueDate) < new Date();
  const paymentAmount = getPaymentAmount();
  const remainingAmount = totalAmount - paymentAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {itemType === 'invoice' ? (
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
              {dueDate && (
                <p className={cn(
                  "text-xs",
                  isOverdue ? "text-red-500 font-medium" : "text-slate-500"
                )}>
                  {isOverdue ? '⚠️ Vencida em ' : 'Vencimento: '}
                  {format(new Date(dueDate), "dd 'de' MMMM", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Total Amount */}
          <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Valor Total</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </Card>

          {/* Payment Options */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Opção de Pagamento
            </p>

            {/* Full Payment */}
            <button
              onClick={() => setPaymentType('full')}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all text-left",
                paymentType === 'full' 
                  ? "border-primary bg-primary/5" 
                  : "border-slate-200 dark:border-slate-700"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Pagamento Total</p>
                  <p className="text-xs text-slate-500">Quita todo o valor</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{formatCurrency(totalAmount)}</span>
                  {paymentType === 'full' && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Minimum Payment (only for invoices) */}
            {itemType === 'invoice' && minimumAmount && (
              <button
                onClick={() => setPaymentType('minimum')}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  paymentType === 'minimum' 
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" 
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Pagamento Mínimo</p>
                    <p className="text-xs text-amber-600">⚠️ Cobra juros sobre o restante</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600">{formatCurrency(minimumAmount)}</span>
                    {paymentType === 'minimum' && (
                      <div className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )}

            {/* Partial Payment */}
            {allowPartial && (
              <button
                onClick={() => setPaymentType('partial')}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  paymentType === 'partial' 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Pagamento Parcial</p>
                    <p className="text-xs text-slate-500">Escolha o valor a pagar</p>
                  </div>
                  {paymentType === 'partial' && (
                    <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {paymentType === 'partial' && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">R$</span>
                      <input
                        type="text"
                        value={amountDisplay}
                        onChange={handleAmountChange}
                        placeholder="0,00"
                        className="flex-1 text-xl font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-900 dark:text-white"
                        inputMode="numeric"
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Summary */}
          {paymentType !== 'full' && paymentAmount > 0 && (
            <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Após este pagamento:</p>
                  <p className="mt-1">
                    Saldo restante: <strong>{formatCurrency(remainingAmount)}</strong>
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <Button
            onClick={handleConfirm}
            disabled={isLoading || paymentAmount <= 0}
            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
            isLoading={isLoading}
          >
            <Check className="h-5 w-5 mr-2" />
            Confirmar Pagamento de {formatCurrency(paymentAmount)}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
