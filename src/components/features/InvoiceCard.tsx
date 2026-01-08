import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  CreditCard, 
  ChevronRight, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { 
  type InvoicePeriod, 
  getInvoiceStatusLabel,
  getDaysUntilClosing,
  getDaysUntilDue,
  type CreditCardDates
} from '@/lib/utils/invoice-calculator';

interface InvoiceCardProps {
  invoice: InvoicePeriod;
  totalAmount: number;
  card: CreditCardDates & { name: string; color?: string };
  onPayClick?: () => void;
  onViewDetails?: () => void;
  compact?: boolean;
}

export function InvoiceCard({
  invoice,
  totalAmount,
  card,
  onPayClick,
  onViewDetails,
  compact = false,
}: InvoiceCardProps) {
  const statusInfo = getInvoiceStatusLabel(invoice.status);
  const daysUntilClosing = getDaysUntilClosing(card);
  const daysUntilDue = getDaysUntilDue(card);
  
  const isUrgent = invoice.status === 'closed' && daysUntilDue <= 3;
  const isOverdue = invoice.status === 'overdue';

  if (compact) {
    return (
      <button
        onClick={onViewDetails}
        className={cn(
          "w-full text-left p-4 rounded-2xl border transition-all",
          "bg-white dark:bg-slate-800 hover:shadow-md active:scale-[0.99]",
          isOverdue && "border-red-200 dark:border-red-800",
          isUrgent && !isOverdue && "border-amber-200 dark:border-amber-800",
          !isUrgent && !isOverdue && "border-slate-100 dark:border-slate-700"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: card.color || '#6366f1' }}
            >
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {invoice.label}
              </p>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                statusInfo.bgColor,
                statusInfo.color
              )}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-lg text-slate-900 dark:text-white">
              {formatCurrency(totalAmount)}
            </p>
            {invoice.status === 'closed' && (
              <p className="text-[10px] text-slate-500">
                Vence em {daysUntilDue} dias
              </p>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden",
      isOverdue && "ring-2 ring-red-500",
      isUrgent && !isOverdue && "ring-2 ring-amber-500"
    )}>
      {/* Header */}
      <div 
        className="p-5 text-white relative overflow-hidden"
        style={{ backgroundColor: card.color || '#6366f1' }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-5 -mb-5" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 opacity-80" />
              <span className="text-sm font-medium opacity-80">{card.name}</span>
            </div>
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              invoice.status === 'open' && "bg-white/20",
              invoice.status === 'closed' && "bg-amber-400 text-amber-900",
              invoice.status === 'paid' && "bg-green-400 text-green-900",
              invoice.status === 'overdue' && "bg-red-400 text-red-900"
            )}>
              {statusInfo.label}
            </span>
          </div>
          
          <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
            Fatura de {invoice.label}
          </p>
          <p className="text-4xl font-black tracking-tight">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Dates Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Calendar className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase">Fechamento</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white">
              {format(invoice.closingDate, "dd 'de' MMM", { locale: ptBR })}
            </p>
            {invoice.status === 'open' && (
              <p className="text-xs text-slate-500 mt-0.5">
                em {daysUntilClosing} dias
              </p>
            )}
          </div>
          
          <div className={cn(
            "rounded-xl p-3",
            isOverdue 
              ? "bg-red-50 dark:bg-red-900/20" 
              : isUrgent 
                ? "bg-amber-50 dark:bg-amber-900/20"
                : "bg-slate-50 dark:bg-slate-800"
          )}>
            <div className={cn(
              "flex items-center gap-2 mb-1",
              isOverdue ? "text-red-500" : isUrgent ? "text-amber-500" : "text-slate-400"
            )}>
              <Clock className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase">Vencimento</span>
            </div>
            <p className={cn(
              "font-bold",
              isOverdue 
                ? "text-red-600" 
                : isUrgent 
                  ? "text-amber-600"
                  : "text-slate-900 dark:text-white"
            )}>
              {format(invoice.dueDate, "dd 'de' MMM", { locale: ptBR })}
            </p>
            {invoice.status === 'closed' && (
              <p className={cn(
                "text-xs mt-0.5",
                isOverdue ? "text-red-500" : isUrgent ? "text-amber-500" : "text-slate-500"
              )}>
                {isOverdue ? 'Vencida!' : `em ${daysUntilDue} dias`}
              </p>
            )}
          </div>
        </div>

        {/* Alert for urgent/overdue */}
        {(isUrgent || isOverdue) && (
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl",
            isOverdue 
              ? "bg-red-100 dark:bg-red-900/30" 
              : "bg-amber-100 dark:bg-amber-900/30"
          )}>
            <AlertTriangle className={cn(
              "h-5 w-5 flex-shrink-0",
              isOverdue ? "text-red-600" : "text-amber-600"
            )} />
            <p className={cn(
              "text-xs font-medium",
              isOverdue ? "text-red-700" : "text-amber-700"
            )}>
              {isOverdue 
                ? "Esta fatura está vencida. Pague o mais rápido possível para evitar juros."
                : "Fatura fecha em breve. Não esqueça de pagar antes do vencimento!"
              }
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {invoice.status !== 'paid' && onPayClick && (
            <Button 
              onClick={onPayClick}
              className={cn(
                "flex-1",
                isOverdue && "bg-red-600 hover:bg-red-700",
                isUrgent && !isOverdue && "bg-amber-600 hover:bg-amber-700"
              )}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Pagar Fatura
            </Button>
          )}
          
          {onViewDetails && (
            <Button 
              variant="outline" 
              onClick={onViewDetails}
              className={invoice.status === 'paid' ? 'flex-1' : ''}
            >
              Ver Detalhes
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Versão mini para mostrar em listas
 */
export function InvoiceMiniCard({
  invoice,
  totalAmount,
  onClick,
}: {
  invoice: InvoicePeriod;
  totalAmount: number;
  onClick?: () => void;
}) {
  const statusInfo = getInvoiceStatusLabel(invoice.status);
  
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          statusInfo.bgColor
        )}>
          <Receipt className={cn("h-4 w-4", statusInfo.color)} />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            {invoice.label}
          </p>
          <p className={cn("text-[10px] font-medium", statusInfo.color)}>
            {statusInfo.label}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-sm text-slate-900 dark:text-white">
          {formatCurrency(totalAmount)}
        </p>
        <ChevronRight className="h-4 w-4 text-slate-400 ml-auto" />
      </div>
    </button>
  );
}
