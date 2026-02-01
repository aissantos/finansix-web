import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Receipt,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { TransactionItem } from '@/components/features/TransactionItem';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SmartInsights } from '@/components/features/SmartInsights';
import { useCreditCards, useTransactions } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { calculateSpendingInsights } from '@/lib/analysis';
import { format, parse, addMonths, subMonths, setDate, endOfMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InvoiceDetailsPage() {
  const { id: cardId, month } = useParams<{ id: string; month: string }>();
  const navigate = useNavigate();
  
  const { data: cards } = useCreditCards();
  const card = cards?.find(c => c.id === cardId);

  // Switch to useTransactions to ensure we see ALL items (including imported PDF items that are just 'transactions')
  // We fetch a bit broadly and filter locally to handle the billing cycle logic
  const targetMonthStr = month || format(new Date(), 'yyyy-MM');
  const dateObj = parse(targetMonthStr, 'yyyy-MM', new Date());
  
  // Heuristic: Fetch transactions around this month to catch everything relevant
  // Ideally backend should handle "Current Bill" logic, but specific closing dates make it complex.
  const { data: allTransactions, isLoading } = useTransactions({ 
      creditCardId: cardId,
      limit: 500 // Increased limit to ensure we have enough history for insights (approx 6-12 months)
  });

  // Filter Logic for Current Invoice View
  const currentCard = cards?.find(c => c.id === cardId);
  const closingDay = currentCard?.closing_day || 1;
  const invoiceRefDate = parse(targetMonthStr + '-01', 'yyyy-MM-dd', new Date());

  let cycleEndDate = setDate(invoiceRefDate, closingDay);
  // Handle end of month overflow
  if (closingDay > 28) {
     const endOfMonthDate = endOfMonth(invoiceRefDate);
     if (closingDay > endOfMonthDate.getDate()) {
         cycleEndDate = endOfMonthDate;
     }
  }
  const cycleStartDate = addDays(subMonths(cycleEndDate, 1), 1);

  const invoiceItems = allTransactions?.filter(t => {
      // 1. Installments: Check if specific installment billing month matches
      if (t.is_installment && t.installments && t.installments.length > 0) {
          return t.installments.some(inst => inst.billing_month === targetMonthStr);
      }

      // 2. Regular Transactions (One-time or Imported)
      if (!t.is_installment) {
         if (t.credit_card_id !== cardId) return false;

         const tDate = parse(t.transaction_date, 'yyyy-MM-dd', new Date());
         const isInCycle = (tDate >= cycleStartDate && tDate <= cycleEndDate);
         const isSameMonthStr = t.transaction_date.startsWith(targetMonthStr);

         return isInCycle || isSameMonthStr;
      }
      
      return false;
  }) || [];

  const totalAmount = invoiceItems.reduce((sum, item) => {
      // If installment, sum only the installment amount for this month
      if (item.is_installment && item.installments) {
          const inst = item.installments.find(i => i.billing_month === targetMonthStr);
          return sum + (inst ? inst.amount : 0);
      }
      return sum + item.amount;
  }, 0);

  // Navigation Handlers
  const handlePrevMonth = () => {
    const prev = subMonths(dateObj, 1);
    navigate(`/cards/${cardId}/invoices/${format(prev, 'yyyy-MM')}`);
  };

  const handleNextMonth = () => {
    const next = addMonths(dateObj, 1);
    navigate(`/cards/${cardId}/invoices/${format(next, 'yyyy-MM')}`);
  };

  // Prepare Data for Insights (Aggregation by Month)
  const historyData = !allTransactions ? [] : Object.values(allTransactions.reduce((acc, t) => {
      // Group by effective billing month
      // For installments: split into multiple months
      if (t.is_installment && t.installments) {
          t.installments.forEach(inst => {
             if (!inst.billing_month) return;
             const m = inst.billing_month.substring(0, 7);
             if (!acc[m]) acc[m] = { month: m, total: 0 };
             acc[m].total += inst.amount;
          });
      } else {
          // Simple transaction
          const m = t.transaction_date.substring(0, 7);
          if (!acc[m]) acc[m] = { month: m, total: 0 };
          acc[m].total += t.amount; // Use amount_cents ideally but simple sum works for approximation
      }
      return acc;
  }, {} as Record<string, { month: string; total: number }>)).sort((a, b) => a.month.localeCompare(b.month));

  const insights = calculateSpendingInsights(totalAmount, historyData, targetMonthStr);


  if (isLoading) return <PageLoaderSkeleton />;
  if (!card) return <div className="p-8 text-center">Cartão não encontrado</div>;

  return (
    <>
      <Header 
        title="Detalhes da Fatura" 
        showBack 
        onBack={() => navigate(-1)} 
        right={
          <Button variant="ghost" size="icon" className="rounded-full">
            <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Button>
        }
      />
      
      <PageContainer className="pb-24">
        
        {/* Invoice Summary Header with Navigation */}
        <div className="mb-6 flex flex-col items-center">
            <div className="flex items-center gap-4 mb-2">
               <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-full">
                  <ChevronLeft className="h-5 w-5 text-slate-400" />
               </Button>
               
               <Badge variant="outline" className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border-0">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(dateObj, 'MMMM yyyy', { locale: ptBR })}
               </Badge>

               <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-full">
                  <ChevronRight className="h-5 w-5 text-slate-400" />
               </Button>
            </div>

            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {formatCurrency(totalAmount)}
            </h1>
            <p className="text-sm text-slate-500">
                Vencimento em {card.due_day} de {format(dateObj, 'MMMM', { locale: ptBR })}
            </p>
        </div>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <div className="mb-6 px-1">
             <SmartInsights insights={insights} />
          </div>
        )}

        {invoiceItems.length === 0 ? (
            <Card className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 border-dashed">
                <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nenhuma transação nesta fatura</p>
            </Card>
        ) : (
            <div className="space-y-3">
                {invoiceItems.map(item => {
                    // Prepare display amount (installment portion or full)
                    let displayAmount = item.amount;
                    let displayDate = item.transaction_date;
                    let description = item.description;
                    
                    if (item.is_installment && item.installments) {
                        const inst = item.installments.find(i => i.billing_month === targetMonthStr);
                        if (inst) {
                             displayAmount = inst.amount;
                             displayDate = inst.due_date;
                             description = `${item.description} (${inst.installment_number}/${item.total_installments})`;
                        }
                    }

                    return (
                        <TransactionItem
                            key={item.id}
                            transaction={{
                                ...item,
                                amount: displayAmount,
                                description: description,
                                transaction_date: displayDate
                            }}
                            onClick={() => navigate(`/transactions/${item.id}/edit`)}
                        />
                    );
                })}
            </div>
        )}

        {/* Floating Action Button for Payment or Export */}
        <div className="fixed bottom-6 left-0 right-0 px-6">
            <Button className="w-full h-14 rounded-2xl shadow-xl text-lg font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] transition-transform">
                <Download className="mr-2 h-5 w-5" />
                Exportar PDF
            </Button>
        </div>

      </PageContainer>
    </>
  );
}

function PageLoaderSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
            </div>
        </div>
    )
}
