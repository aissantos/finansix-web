import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Receipt,
  Download,
  Share2
} from 'lucide-react';
import { TransactionItem } from '@/components/features/TransactionItem';
import { Header, PageContainer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCreditCards, useInstallments } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InvoiceDetailsPage() {
  const { id: cardId, month } = useParams<{ id: string; month: string }>();
  const navigate = useNavigate();
  
  const { data: cards } = useCreditCards();
  const card = cards?.find(c => c.id === cardId);

  // We need to fetch installments filtering by this billing month
  // NOTE: efficient hook typically filters in memory or query param. 
  // reusing useInstallments and filtering locally since supabase logic fetches all usually. 
  // Ideally, useInstallments should accept a billing month filter for efficiency.
  const { data: allInstallments, isLoading } = useInstallments({ creditCardId: cardId });

  // Filter Logic
  // Matches billing month "yyyy-MM"
  const targetMonth = month || format(new Date(), 'yyyy-MM');
  
  const invoiceItems = allInstallments?.filter(i => {
     // Use billing_month if present
     if (i.billing_month) {
         return i.billing_month.startsWith(targetMonth);
     }
     
     // Fallback: This is fragile if billing_month is missing, 
     // but acceptable for now as we are transitioning.
     // We assume closing day logic has assigned it correctly if we had a backend function, 
     // but here we rely on what frontend computed previously or just filtering by due_date approximate.
     // Let's trust billing_month is populated by the backend/ingestion correctly now.
     
     // If no billing_month, try to approximate from due_date:
     // If due_date is in Month M (e.g. Feb), and card due_day is X. 
     return i.due_date.startsWith(targetMonth);
  }) || [];

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

  // Parse month for display
  const dateObj = parse(targetMonth, 'yyyy-MM', new Date());

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
        
        {/* Invoice Summary Header */}
        <div className="mb-6 text-center">
            <Badge variant="outline" className="mb-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 border-0">
                <Calendar className="h-3 w-3 mr-1" />
                {format(dateObj, 'MMMM yyyy', { locale: ptBR })}
            </Badge>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {formatCurrency(totalAmount)}
            </h1>
            <p className="text-sm text-slate-500">
                Vencimento em {card.due_day} de {format(dateObj, 'MMMM', { locale: ptBR })}
            </p>
        </div>

        {invoiceItems.length === 0 ? (
            <Card className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 border-dashed">
                <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Nenhuma transação nesta fatura</p>
            </Card>
        ) : (
            <div className="space-y-3">
                {invoiceItems.map(item => (
                    <TransactionItem
                        key={item.id}
                        transaction={{
                            ...item.transaction!,
                            amount: item.amount,
                            // Ensure description falls back correctly if transaction is missing (legacy compat)
                            description: item.transaction?.description || `Parcela ${item.installment_number}`,
                            // Override date to show due date of installment or transaction date? 
                            // Usually for invoice view, we might want to see the purchase date, but the list is "invoice items".
                            // Let's keep purchase date if available, or due date.
                            // The TransactionItem displays "date".
                            transaction_date: item.transaction?.transaction_date || item.due_date,
                            category: item.transaction?.category
                        }}
                        onClick={() => navigate(`/transactions/${item.transaction_id}/edit`)}
                    />
                ))}
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
