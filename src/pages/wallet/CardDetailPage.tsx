import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  ShoppingCart,
  Receipt,
  Calculator,
  DollarSign
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCreditCards, useInstallments } from '@/hooks';
import { formatCurrency, formatCardNumber, cn } from '@/lib/utils';
import { format, addMonths, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: cards, isLoading: cardsLoading } = useCreditCards();
  const { data: installments, isLoading: installmentsLoading } = useInstallments();

  const card = cards?.find(c => c.id === id);
  const cardInstallments = installments?.filter(i => i.credit_card_id === id) || [];

  // Calculate current billing cycle
  const today = new Date();
  const currentDay = today.getDate();
  
  const getBillingDates = () => {
    if (!card) return { closingDate: new Date(), dueDate: new Date(), nextClosingDate: new Date() };
    
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Current closing date
    let closingMonth = currentMonth;
    let closingYear = currentYear;
    
    // If we're past closing day, move to next month
    if (currentDay > card.closing_day) {
      closingMonth += 1;
      if (closingMonth > 11) {
        closingMonth = 0;
        closingYear += 1;
      }
    }
    
    const closingDate = new Date(closingYear, closingMonth, card.closing_day);
    
    // Due date is next month after closing
    const dueDate = new Date(
      closingDate.getFullYear(),
      closingDate.getMonth() + 1,
      card.due_day
    );
    
    // Next closing date
    const nextClosingDate = addMonths(closingDate, 1);
    
    return { closingDate, dueDate, nextClosingDate };
  };

  const { closingDate, dueDate, nextClosingDate } = getBillingDates();
  
  // Best purchase day is right after closing
  const bestPurchaseDay = card ? (card.closing_day % 30) + 1 : 1;
  const daysUntilClosing = differenceInDays(closingDate, today);
  const daysUntilDue = differenceInDays(dueDate, today);

  // Group installments by status
  const currentBillInstallments = cardInstallments.filter(i => {
    const dueDate = new Date(i.due_date);
    return dueDate <= closingDate && i.status === 'pending';
  });
  
  const currentBillTotal = currentBillInstallments.reduce((sum, i) => sum + i.amount, 0);
  const upcomingInstallments = cardInstallments.filter(i => {
    const dueDate = new Date(i.due_date);
    return dueDate > closingDate && dueDate <= nextClosingDate && i.status === 'pending';
  });
  
  const upcomingTotal = upcomingInstallments.reduce((sum, i) => sum + i.amount, 0);

  if (cardsLoading || installmentsLoading) {
    return (
      <>
        <Header title="Detalhes do Cartão" showBack onBack={() => navigate(-1)} />
        <PageContainer className="space-y-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </PageContainer>
      </>
    );
  }

  if (!card) {
    return (
      <>
        <Header title="Cartão não encontrado" showBack onBack={() => navigate(-1)} />
        <PageContainer>
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">Cartão não encontrado</p>
          </Card>
        </PageContainer>
      </>
    );
  }

  const usagePercent = (card.used_limit / card.credit_limit) * 100;
  const isCustomColor = card.color?.startsWith('#') || card.color?.startsWith('rgb');

  return (
    <>
      <Header title={card.name} showBack onBack={() => navigate(-1)} />
      <PageContainer className="space-y-6 pb-24">
        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6 shadow-2xl">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
            <CreditCard className="w-64 h-64 -rotate-12 translate-x-1/4 -translate-y-1/4" />
          </div>
          
          <div className="relative z-10 space-y-6">
            {/* Card Info */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                  {card.brand}
                </p>
                <h2 className="text-white text-2xl font-extrabold">
                  {card.name}
                </h2>
                <p className="text-white/80 text-sm font-mono mt-1">
                  {card.last_four_digits && formatCardNumber(card.last_four_digits)}
                </p>
              </div>
              
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: isCustomColor ? card.color! : '#6366f1' }}
              >
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                  Disponível
                </p>
                <p className="text-white text-xl font-bold">
                  {formatCurrency(card.available_limit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                  Limite Total
                </p>
                <p className="text-white text-xl font-bold">
                  {formatCurrency(card.credit_limit)}
                </p>
              </div>
            </div>

            {/* Usage Bar */}
            <div>
              <div className="flex justify-between text-xs text-white/60 mb-2">
                <span>Utilizado: {formatCurrency(card.used_limit)}</span>
                <span>{Math.round(usagePercent)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Billing Cycle Info */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Fechamento
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Dia {card.closing_day}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {daysUntilClosing > 0 ? `Em ${daysUntilClosing} dias` : 'Hoje'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Vencimento
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Dia {card.due_day}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {daysUntilDue > 0 ? `Em ${daysUntilDue} dias` : 'Hoje'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Best Purchase Day */}
        <Card className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                💡 Melhor dia para comprar
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Dia <strong>{bestPurchaseDay}</strong> - Logo após o fechamento, maximiza o prazo de pagamento
              </p>
            </div>
          </div>
        </Card>

        {/* Current Bill */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Fatura Atual
            </h3>
            <Badge variant="outline" className="font-mono">
              {format(closingDate, 'MMM yyyy', { locale: ptBR })}
            </Badge>
          </div>

          <Card className="p-5 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Total da Fatura
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(currentBillTotal)}
                </p>
              </div>
              <Button
                onClick={() => navigate('/transactions/new', { state: { creditCardId: card.id } })}
                className="rounded-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </Card>

          {currentBillInstallments.length > 0 ? (
            <div className="space-y-2">
              {currentBillInstallments.map((inst) => (
                <Card key={inst.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Parcela {inst.installment_number}/{inst.total_installments}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Vence {format(new Date(inst.due_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inst.amount)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Nenhuma compra nesta fatura</p>
            </Card>
          )}
        </div>

        {/* Upcoming Bill */}
        {upcomingInstallments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Próxima Fatura
              </h3>
              <Badge variant="outline" className="font-mono">
                {format(nextClosingDate, 'MMM yyyy', { locale: ptBR })}
              </Badge>
            </div>

            <Card className="p-5 mb-3 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">
                    Previsão
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(upcomingTotal)}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-slate-400" />
              </div>
            </Card>

            <div className="space-y-2">
              {upcomingInstallments.slice(0, 3).map((inst) => (
                <Card key={inst.id} className="p-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Parcela {inst.installment_number}/{inst.total_installments}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Vence {format(new Date(inst.due_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inst.amount)}
                    </p>
                  </div>
                </Card>
              ))}
              {upcomingInstallments.length > 3 && (
                <p className="text-center text-xs text-slate-500 py-2">
                  +{upcomingInstallments.length - 3} parcelas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid gap-3">
          <Button
            onClick={() => navigate('/transactions/new', { state: { creditCardId: card.id } })}
            className="w-full justify-start h-auto py-4 bg-gradient-to-r from-primary to-blue-600 text-white"
          >
            <Plus className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-bold">Nova Compra</p>
              <p className="text-xs opacity-90">Cadastrar compra parcelada ou à vista</p>
            </div>
          </Button>

          <Button
            onClick={() => navigate(`/cards/${card.id}/edit`)}
            variant="outline"
            className="w-full justify-start h-auto py-4"
          >
            <CreditCard className="h-5 w-5 mr-3" />
            <div className="text-left">
              <p className="font-bold">Editar Cartão</p>
              <p className="text-xs text-slate-500">Alterar limites, datas e configurações</p>
            </div>
          </Button>
        </div>
      </PageContainer>
    </>
  );
}