import { Sparkles, Calendar, Clock } from 'lucide-react';
import { useBestCard } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function CardOptimizer() {
  const { data: recommendation, isLoading } = useBestCard();

  if (isLoading) {
    return <CardOptimizerSkeleton />;
  }

  if (!recommendation) {
    return (
      <Card className="card-optimizer p-5">
        <p className="text-sm text-slate-500 text-center">
          Adicione um cartão de crédito para ver a melhor opção de compra.
        </p>
      </Card>
    );
  }

  const today = new Date();
  const daysUntilClosing = differenceInDays(recommendation.closingDate, today);
  const daysUntilDue = differenceInDays(recommendation.dueDate, today);

  return (
    <section className="card-optimizer">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Otimizador de Cartão
        </h3>
        <span className="text-xs text-primary font-bold">Ver todos</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-5 shadow-lg">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/10">
            <Sparkles className="h-3 w-3" />
            Melhor Opção Hoje
          </div>

          {/* Card info */}
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-bold">{recommendation.cardName}</h4>
              <p className="text-blue-100 text-sm leading-snug mt-1">
                {daysUntilClosing > 0
                  ? `Fecha em ${daysUntilClosing} dias`
                  : daysUntilClosing === 0
                    ? 'Fecha hoje!'
                    : 'Fatura já fechou'}
              </p>
            </div>

            {/* Mini card icon */}
            <div className="w-16 h-10 bg-white/20 rounded-lg flex flex-col justify-between p-2">
              <div className="w-4 h-2 bg-yellow-400 rounded-sm" />
              <div className="flex justify-end gap-1">
                <div className="h-2 w-2 rounded-full bg-white/50" />
                <div className="h-2 w-2 rounded-full bg-white/30" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-200 uppercase font-bold flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fechamento
              </span>
              <span className="text-sm font-medium">
                {format(recommendation.closingDate, 'dd/MM', { locale: ptBR })}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] text-blue-200 uppercase font-bold flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Vencimento
              </span>
              <span className="text-sm font-medium">
                {format(recommendation.dueDate, 'dd/MM', { locale: ptBR })}
              </span>
            </div>

            <div className="flex flex-col text-right">
              <span className="text-[10px] text-blue-200 uppercase font-bold">
                Limite
              </span>
              <span className="text-sm font-medium">
                {formatCurrency(recommendation.availableLimit)}
              </span>
            </div>
          </div>

          {/* Days until payment highlight */}
          <div className="mt-3 bg-white/10 rounded-lg p-2 text-center">
            <span className="text-xs font-bold">
              {daysUntilDue > 0 
                ? `💰 ${daysUntilDue} dias até o pagamento`
                : daysUntilDue === 0
                  ? '⚠️ Vence hoje!'
                  : `⚠️ Venceu há ${Math.abs(daysUntilDue)} dias`
              }
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CardOptimizerSkeleton() {
  return (
    <section className="card-optimizer">
      <div className="flex items-center justify-between mb-3 px-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </section>
  );
}