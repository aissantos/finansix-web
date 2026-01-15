import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertTriangle, ArrowDownCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { usePaymentSummary } from '@/hooks';

interface PaymentSummaryCardsProps {
  compact?: boolean;
  className?: string;
}

export const PaymentSummaryCards = memo(function PaymentSummaryCards({
  compact = false,
  className,
}: PaymentSummaryCardsProps) {
  const { data: summary, isLoading } = usePaymentSummary();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const handleNavigate = (label: string) => {
    switch (label) {
      case 'A Pagar':
        navigate('/accounts-payable?filter=pending');
        break;
      case 'Vencido':
        navigate('/accounts-payable?filter=overdue');
        break;
      case 'Pago':
        navigate('/accounts-payable?filter=paid');
        break;
      default:
        // No navigation for others yet
        break;
    }
  };

  const items = [
    {
      label: 'A Pagar',
      value: summary?.pending ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      action: true
    },
    {
      label: 'Pago',
      value: summary?.paid ?? 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      action: true
    },
    {
      label: 'Vencido',
      value: summary?.overdue ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      highlight: (summary?.overdue ?? 0) > 0,
      action: true
    },
    {
      label: 'Saldo Parcial',
      value: summary?.partial_balance ?? 0,
      icon: ArrowDownCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      isNegative: true,
      action: false
    },
  ];

  if (compact) {
    return (
      <div className={cn("grid grid-cols-4 gap-2", className)}>
        {items.map((item) => {
          const Icon = item.icon;
          const showValue = item.value > 0 || item.label === 'A Pagar';
          
          return (
            <div
              key={item.label}
              onClick={() => item.action && handleNavigate(item.label)}
              className={cn(
                "rounded-xl p-2 text-center border transition-transform active:scale-95",
                item.bgColor,
                item.borderColor,
                item.highlight && "ring-2 ring-red-500 ring-offset-1",
                item.action && "cursor-pointer hover:opacity-80"
              )}
            >
              <Icon className={cn("h-4 w-4 mx-auto mb-1", item.color)} />
              <p className={cn("text-xs font-bold", item.color)}>
                {showValue ? formatCurrency(item.isNegative ? -item.value : item.value) : '-'}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const showValue = item.value > 0 || item.label === 'A Pagar';
        
        return (
          <Card
            key={item.label}
            onClick={() => item.action && handleNavigate(item.label)}
            className={cn(
              "glass-card p-4 border transition-all active:scale-[0.98]",
              item.bgColor,
              item.borderColor,
              item.highlight && "ring-2 ring-red-500 ring-offset-2",
              item.action && "cursor-pointer hover:shadow-md"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
                  {item.label}
                </p>
                <p className={cn("text-lg font-bold", item.color)}>
                  {showValue 
                    ? formatCurrency(item.isNegative && item.value > 0 ? -item.value : item.value) 
                    : 'R$ 0,00'
                  }
                </p>
              </div>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", item.bgColor)}>
                <Icon className={cn("h-5 w-5", item.color)} />
              </div>
            </div>
            {item.highlight && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                ⚠️ Atenção: contas vencidas
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
});

export default PaymentSummaryCards;
