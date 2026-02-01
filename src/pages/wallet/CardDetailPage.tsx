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
  DollarSign,
  // X removed
  Check,
  MoreVertical,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  // Upload removed
} from 'lucide-react';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input'; // Removed unused import
import { useCreditCards, useInstallments } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatCardNumber } from '@/lib/utils';
import type { InstallmentWithDetails } from '@/types';
import { format, addMonths, differenceInDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/ui/icon';
import { InvoiceImportModal } from '@/components/features/InvoiceImportModal';
import { InvoiceCharts } from '@/components/features/InvoiceCharts';

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: cards, isLoading: cardsLoading } = useCreditCards();
  
  // Get installments for this specific card (all months to show projections)
  const { data: allInstallments, isLoading: installmentsLoading } = useInstallments({
    creditCardId: id,
  });

  // Form state
  // const [showForm, setShowForm] = useState(false); // Removed inline form
  const [showImportModal, setShowImportModal] = useState(false);
  // const [isSubmitting, setIsSubmitting] = useState(false); // Removed inline form state
  // const [formData, setFormData] = useState({...}); // Removed inline form state

  const card = cards?.find(c => c.id === id);
  const cardInstallments = allInstallments || [];

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

  // handleSubmit removed as inline form is removed

  // Group installments by status - using billing_month for correct filtering
  // This avoids issues when due_date is in the next month relative to closing date
  const targetMonthStr = format(closingDate, 'yyyy-MM');
  const nextTargetMonthStr = format(nextClosingDate, 'yyyy-MM');

  const currentBillInstallments = cardInstallments.filter(i => {
    // Determine billing month from installment data ('yyyy-MM-dd')
    const startOfBillingMonth = i.billing_month ? i.billing_month.substring(0, 7) : ''; 
    
    // If billing_month is missing, fallback to due_date logic (but improved)
    if (!startOfBillingMonth) {
       const dueDate = new Date(i.due_date);
       const dueMonth = startOfMonth(dueDate);
       const targetMonth = startOfMonth(closingDate);
       // This fallback still has the flaw but handles legacy data without billing_month
       return dueMonth.getTime() === targetMonth.getTime() && i.status === 'pending';
    }

    return startOfBillingMonth === targetMonthStr && i.status === 'pending';
  });
  
  // Overdue installments: past due_date but still pending (separate section)
  const overdueInstallments = cardInstallments.filter(i => {
    const dueDate = new Date(i.due_date);
    return dueDate < today && i.status === 'pending';
  });
  
  const currentBillTotal = currentBillInstallments.reduce((sum, i) => sum + i.amount, 0);
  // Note: overdueTotal available for future use in UI
  void overdueInstallments.reduce((sum, i) => sum + i.amount, 0);
  
  const upcomingInstallments = cardInstallments.filter(i => {
    const startOfBillingMonth = i.billing_month ? i.billing_month.substring(0, 7) : '';
    
    if (!startOfBillingMonth) {
       const dueDate = new Date(i.due_date);
       const dueMonth = startOfMonth(dueDate);
       const nextBillingMonth = startOfMonth(nextClosingDate);
       return dueMonth.getTime() === nextBillingMonth.getTime() && i.status === 'pending';
    }

    return startOfBillingMonth === nextTargetMonthStr && i.status === 'pending';
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


        {/* Insights & Charts (Global Analysis) */}
        {cardInstallments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Análise Global de Gastos
            </h3>
            {/* Pass FULL history (cardInstallments) for global patterns */}
            <InvoiceCharts transactions={cardInstallments} viewMode="monthly" />
          </div>
        )}

        {/* Closed Bill (Waiting Payment) */}
        {(() => {
          // Calculate previous closing date to find closed but unpaid bills
          const previousClosingDate = addMonths(closingDate, -1);
          const previousTargetMonthStr = format(previousClosingDate, 'yyyy-MM');
          
          const closedBillInstallments = cardInstallments.filter(i => {
            const startOfBillingMonth = i.billing_month ? i.billing_month.substring(0, 7) : '';
            return startOfBillingMonth === previousTargetMonthStr && i.status === 'pending';
          });
          
          if (closedBillInstallments.length === 0) return null;
          
          const closedBillTotal = closedBillInstallments.reduce((sum, i) => sum + i.amount, 0);
          
          // Use component state for collapse? No, we are in render. 
          // We need to move this out of IIFE or use a local component.
          // Let's use a local variable for now, but to handle state, we should extract this to a component 
          // OR iterate within the main component body. 
          // Refactoring to a sub-component "ClosedInvoiceSection".
          
          return (
            <ClosedInvoiceSection 
              installments={closedBillInstallments} 
              total={closedBillTotal} 
              closingDate={previousClosingDate}
              dueDay={card?.due_day}
              onPay={() => {
                 toast({ title: 'Marcar como paga?', description: 'Funcionalidade em desenvolvimento.' })
              }}
              onEditTransaction={(id) => navigate(`/transactions/${id}/edit`)}
              onDeleteTransaction={async (id) => {
                 // ... delete logic passed as prop or handled inside
                 if (confirm('Excluir esta parcela e todas as seguintes?')) {
                     try {
                        const { error } = await supabase.from('transactions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
                         if (error) throw error;
                         toast({ title: '✅ Compra excluída' });
                         queryClient.invalidateQueries({ queryKey: ['installments'] });
                         queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                     } catch(e) { console.error(e) }
                 }
              }}
            />
          );
        })()}

        {/* Current Bill */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Fatura Atual
            </h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs text-slate-500"
                onClick={() => navigate(`/cards/${card.id}/invoice/${format(closingDate, 'yyyy-MM')}`)}
              >
                Ver tudo <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
              <Badge variant="outline" className="font-mono">
                {format(closingDate, 'MMM yyyy', { locale: ptBR })}
              </Badge>
            </div>
          </div>

          <Card 
            className="p-5 mb-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
            onClick={(e) => {
               // Prevent navigation if clicking buttons inside
               if ((e.target as HTMLElement).closest('button')) return;
               navigate(`/cards/${card.id}/invoice/${format(closingDate, 'yyyy-MM')}`);
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Total da Fatura
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {formatCurrency(currentBillTotal)}
                </p>
              </div>
              <Button
                onClick={() => setShowImportModal(true)}
                className="rounded-full shadow-lg bg-primary text-white hover:scale-[1.02] transition-transform"
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>

            </div>
          </Card>

          {currentBillInstallments.length > 0 ? (
            <div className="space-y-2">
              {currentBillInstallments.map((inst) => (
                <InstallmentCard
                  key={inst.id}
                  installment={inst}
                  onClick={() => {
                     // Check if it looks like an invoice payment or just a transaction
                     // For now, always open edit, BUT if user wants "invoice details" on click, 
                     // he probably means clicking the *list* itself opens the deep dive?
                     // The requirement says: "clicar na fatura cadastrada".
                     // If he sees "Pagamento Fatura Nubank", that's likely an imported invoice.
                     // Let's add specific logic: if description contains "Fatura", go to invoice details.
                     if (inst.transaction?.description.toLowerCase().includes('fatura')) {
                        navigate(`/cards/${card.id}/invoice/${format(closingDate, 'yyyy-MM')}`);
                     } else {
                        navigate(`/transactions/${inst.transaction_id}/edit`);
                     }
                  }}
                  onEdit={() => {
                    // Navigate to transaction edit
                    navigate(`/transactions/${inst.transaction_id}/edit`);
                  }}
                  onDelete={async () => {
                    if (confirm('Excluir esta parcela e todas as seguintes?')) {
                      try {
                        
                        // Soft delete the transaction (trigger will cascade to installments)
                        const { error } = await supabase
                          .from('transactions')
                          .update({ deleted_at: new Date().toISOString() })
                          .eq('id', inst.transaction_id)
                          .select();


                        if (error) throw error;

                        toast({ title: '✅ Compra excluída' });
                        
                        // Invalidate queries to refresh data
                        await queryClient.invalidateQueries({ queryKey: ['installments'] });
                        await queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                        await queryClient.invalidateQueries({ queryKey: ['transactions'] });
                      } catch (error) {
                        toast({
                          title: 'Erro ao excluir',
                          description: error instanceof Error ? error.message : 'Tente novamente',
                          variant: 'destructive',
                        });
                      }
                    }
                  }}
                />
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
                <InstallmentCard
                  key={inst.id}
                  installment={inst}
                  onEdit={() => navigate(`/transactions/${inst.transaction_id}/edit`)}
                  onDelete={async () => {
                    if (confirm('Excluir esta parcela e todas as seguintes?')) {
                      try {
                        
                        const { error } = await supabase
                          .from('transactions')
                          .update({ deleted_at: new Date().toISOString() })
                          .eq('id', inst.transaction_id)
                          .select();


                        if (error) throw error;

                        toast({ title: '✅ Compra excluída' });
                        
                        await queryClient.invalidateQueries({ queryKey: ['installments'] });
                        await queryClient.invalidateQueries({ queryKey: ['creditCards'] });
                        await queryClient.invalidateQueries({ queryKey: ['transactions'] });
                      } catch (error) {
                        toast({ 
                          title: 'Erro ao excluir', 
                          description: error instanceof Error ? error.message : 'Tente novamente',
                          variant: 'destructive' 
                        });
                      }
                    }
                  }}
                />
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
      
      {card && (
        <InvoiceImportModal
          creditCardId={card.id}
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['creditCards'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
          }}
        />
      )}
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function InstallmentCard({ 
  installment, 
  onEdit, 
  onDelete,
  onClick
}: { 
  installment: InstallmentWithDetails; 
  onEdit: () => void; 
  onDelete: () => void;
  onClick?: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  
  // Get description and category from joined transaction data
  const description = installment.transaction?.description || `Parcela ${installment.installment_number}/${installment.total_installments}`;
  const category = installment.transaction?.category;

  return (
    <Card 
      className={`p-4 ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-lg">
           {category?.icon ? (
             <Icon name={category.icon} className="h-5 w-5 text-slate-600 dark:text-slate-400" />
           ) : (
             <ShoppingCart className="h-5 w-5 text-slate-600 dark:text-slate-400" />
           )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {description}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
             {category && (
               <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0">
                  {category.name}
               </Badge>
             )}
             <span className="text-xs text-slate-500">
               {installment.total_installments > 1 
                 ? `Parcela ${installment.installment_number}/${installment.total_installments} • ` 
                 : ''}
               {format(new Date(installment.due_date), 'dd/MM')}
             </span>
          </div>
        </div>
        <p className="text-sm font-bold text-slate-900 dark:text-white flex-shrink-0">
          {formatCurrency(installment.amount)}
        </p>
        
        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  onClick={() => { onEdit(); setShowMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4 text-slate-400" />
                  Editar
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                <button
                  onClick={() => { onDelete(); setShowMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function ClosedInvoiceSection({
  installments,
  total,
  closingDate,
  dueDay,
  onPay,
  onEditTransaction,
  onDeleteTransaction
}: {
  installments: InstallmentWithDetails[];
  total: number;
  closingDate: Date;
  dueDay?: number;
  onPay: () => void;
  onEditTransaction: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
           Fatura Fechada
        </h3>
        <Badge variant="danger" className="font-mono">
          Vence {format(closingDate.getDate() > (dueDay || 1) 
            ? addMonths(new Date(closingDate.getFullYear(), closingDate.getMonth(), dueDay || 1), 1) 
            : new Date(closingDate.getFullYear(), closingDate.getMonth(), dueDay || 1), "dd/MM")}
        </Badge>
      </div>

      <Card className="border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 overflow-hidden">
        {/* Header - Always Visible & Clickable */}
        <div 
           className="p-5 flex items-center justify-between cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/20 transition-colors"
           onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
               {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
             </div>
             <div>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 font-medium mb-1">
                  Total a Pagar
                </p>
                <p className="text-2xl font-extrabold text-red-700 dark:text-red-400">
                  {formatCurrency(total)}
                </p>
             </div>
          </div>
          
          <Button 
            variant="destructive"
            className="rounded-full shadow-md ml-4"
            onClick={(e) => {
                e.stopPropagation();
                onPay();
            }}
          >
            <Check className="h-4 w-4 mr-2" />
            Pagar
          </Button>
        </div>
        
        {/* Collapsible Content */}
        {isExpanded && (
           <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
              <div className="h-px bg-red-200/50 dark:bg-red-800/30 my-4" />
              <p className="text-xs text-red-600/70 dark:text-red-400/70 mb-4 px-1">
                Transações desta fatura ({installments.length}):
              </p>

              <div className="space-y-2">
                {installments.map((inst) => (
                  <InstallmentCard
                    key={inst.id}
                    installment={inst}
                    onEdit={() => onEditTransaction(inst.transaction_id)}
                    onDelete={() => onDeleteTransaction(inst.transaction_id)}
                  />
                ))}
              </div>
           </div>
        )}
      </Card>
    </div>
  );
}