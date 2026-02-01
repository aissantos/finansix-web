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
import type { TransactionWithDetails } from '@/types';

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
     // 1. Explicit billing_month match
     if (i.billing_month) {
         return i.billing_month.startsWith(targetMonth);
     }
     
     // 2. Fallback: Parse targetMonth (yyyy-MM) to get range
     // If target is 2026-02:
     // - Closing date approx: 2026-02-XX.
     // - Transactions usually from 2026-01-XX to 2026-02-XX.
     // Simply checking if due_date is in targetMonth is a strong proxy.
     if (i.due_date.startsWith(targetMonth)) return true;

     // 3. Check transaction_date if available (some imported items might be pure transactions)
     // This is tricky without knowing exact closing cycle here.
     // But usually, items listed in a "Invoice Details" view are those DUE in that month.
     return false;
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
                            // Base fields from the parent transaction (if exists) or defaults
                            id: item.transaction_id,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            created_at: (item.transaction as any)?.created_at || new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            user_id: '', // Not used by item
                            household_id: '', // Not used by item
                            account_id: null,
                            credit_card_id: item.credit_card_id,
                            
                            // Visual fields
                            amount: item.amount, // The installment amount
                            description: item.transaction?.description || `Parcela ${item.installment_number}`,
                            transaction_date: item.due_date, // Show due date effectively
                            type: 'expense',
                            status: item.status,
                            
                            // Installment logic
                            is_installment: true,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            total_installments: (item.transaction as any)?.total_installments || item.installment_number, 
                            installments: [item],
                            
                            category: item.transaction?.category
                        } as unknown as TransactionWithDetails}
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
