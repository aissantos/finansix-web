```javascript
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    ChevronLeft, 
    ChevronRight, 
    Wallet, 
    CalendarClock, 
    CheckCircle2, 
    Receipt
} from 'lucide-react';
import { useAccountsPayable, PayableAccount } from '@/hooks/useAccountsPayable';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Header, PageContainer } from '@/components/layout';
import { SwipeableTransactionItem } from '@/components/features/SwipeableTransactionItem';
import { InvoicePaymentModal } from '@/components/modals/InvoicePaymentModal';
import { useUpdateTransaction } from '@/hooks';
import { toast } from '@/hooks/useToast';

type FilterType = 'pending' | 'paid' | 'overdue';

export default function AccountsPayablePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    
    // Get filter from URL or default to 'pending'
    const activeFilter = (searchParams.get('filter') as FilterType) || 'pending';
    
    const { allAccounts, summary, isLoading } = useAccountsPayable(selectedMonth);
    const updateTransaction = useUpdateTransaction();

    const [selectedInvoice, setSelectedInvoice] = useState<PayableAccount | null>(null);

    const handleFilterChange = (filter: FilterType) => {
        setSearchParams({ filter });
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
        setSelectedMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    };

    const filteredAccounts = allAccounts.filter(acc => {
        if (activeFilter === 'overdue') return acc.status === 'overdue';
        if (activeFilter === 'paid') return acc.status === 'paid';
        // pending includes partial invoices essentially
        return acc.status === 'pending' || (acc.type === 'invoice' && acc.status === 'partial');
    });

    const handlePayBill = (account: PayableAccount) => {
        if (account.type === 'invoice') {
            setSelectedInvoice(account); // Open Modal for Credit Card
        } else {
            // Direct Bill Payment
            updateTransaction.mutate({
                id: account.id,
                status: 'completed'
            }, {
                onSuccess: () => {
                    toast({
                        title: 'Conta Paga!',
                        description: `${account.description} marcada como paga.`,
                        variant: 'success'
                    });
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <Header 
                title="Central de Contas" 
                right={
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                        <button onClick={() => handleMonthChange('prev')} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
                            <ChevronLeft className="h-3 w-3 text-slate-500" />
                        </button>
                        <span className="text-xs font-semibold capitalize min-w-[70px] text-center">
                            {format(selectedMonth, 'MMM yyyy', { locale: ptBR })}
                        </span>
                        <button onClick={() => handleMonthChange('next')} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
                            <ChevronRight className="h-3 w-3 text-slate-500" />
                        </button>
                    </div>
                }
            />

            <PageContainer className="pt-6 space-y-6">
                
                {/* Hero Summary Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 shadow-2xl shadow-orange-500/20">
                    <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
                        <Receipt className="w-40 h-40" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col gap-4">
                        <div>
                            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
                                Total a Pagar
                            </p>
                            <h3 className="text-white text-3xl font-extrabold mt-1">
                                {formatCurrency(summary.pending + summary.overdue)}
                            </h3>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="flex-1 bg-white/20 backdrop-blur-md rounded-2xl p-3">
                                <p className="text-white/70 text-[10px] font-bold uppercase">Vencidas</p>
                                <p className="text-white text-lg font-bold">{formatCurrency(summary.overdue)}</p>
                            </div>
                            <div className="flex-1 bg-white/20 backdrop-blur-md rounded-2xl p-3">
                                <p className="text-white/70 text-[10px] font-bold uppercase">Pagas</p>
                                <p className="text-white text-lg font-bold">{formatCurrency(summary.paid)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    {(['pending', 'overdue', 'paid'] as FilterType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleFilterChange(tab)}
                            className={cn(
                                'flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all',
                                activeFilter === tab
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500'
                            )}
                        >
                            {tab === 'pending' ? 'A Pagar' : tab === 'overdue' ? 'Vencidas' : 'Pagas'}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-slate-900 dark:text-white text-lg font-bold">
                            {activeFilter === 'pending' ? 'Contas Pendentes' : activeFilter === 'overdue' ? 'Contas Vencidas' : 'Histórico de Pagamentos'}
                        </h2>
                        <span className="text-xs font-bold text-slate-400">
                            {filteredAccounts.length} itens
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-[72px] w-full bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Receipt className="h-12 w-12 mb-3 opacity-20" />
                            <p>Nenhuma conta encontrada</p>
                        </div>
                    ) : (
                        filteredAccounts.map(account => (
                            <SwipeableTransactionItem
                                key={account.id}
                                transaction={{
                                    id: account.id,
                                    description: account.description,
                                    amount: account.amount,
                                    transaction_date: account.date, // SwipeableTransactionItem uses 'date' or 'transaction_date'? It uses processed props usually.
                                    // We need to adapt data structure or create a compatible object
                                    category: { name: account.type === 'invoice' ? 'Fatura Cartão' : account.category || 'Conta', icon: account.type === 'invoice' ? 'credit-card' : 'file-text' },
                                    status: account.status === 'partial' ? 'pending' : account.status,
                                    type: 'expense'
                                } as any} // Forced cast for MVP compatibility
                                onPay={() => handlePayBill(account)}
                                // Disable other swipes for now or keep standard Edit behavior?
                                // Standard Edit might break for Invoices (virtual entities). We should disable edit for Invoices.
                                onEdit={(tx) => { if(account.type !== 'invoice') navigate(`/transactions/${tx.id}/edit`); }}
                                onDelete={(tx) => { if(account.type !== 'invoice') console.log('Delete feature unused here'); }}
                            />
                        ))
                    )}
                </div>

            </PageContainer>
            
            {/* Invoice Payment Modal */}
            {selectedInvoice && selectedInvoice.cardInvoice && (
                <InvoicePaymentModal 
                    isOpen={!!selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    invoice={selectedInvoice.cardInvoice}
                />
            )}
        </div>
    );
}
```
