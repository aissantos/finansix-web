import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, isSameMonth, subMonths, addMonths } from 'date-fns';
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
import { Card } from '@/components/ui/card';
import { Header, PageContainer } from '@/components/layout';
import { SwipeableTransactionItem } from '@/components/features/SwipeableTransactionItem';
import { InvoicePaymentModal } from '@/components/modals/InvoicePaymentModal'; // To be created
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
            {/* Header with Month Selector */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
                <div className="px-4 h-16 flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-6 w-6 text-slate-600" />
                    </Button>
                    
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                        <button onClick={() => handleMonthChange('prev')} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
                            <ChevronLeft className="h-4 w-4 text-slate-500" />
                        </button>
                        <span className="text-sm font-semibold capitalize min-w-[100px] text-center">
                            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <button onClick={() => handleMonthChange('next')} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors">
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                        </button>
                    </div>

                    <div className="w-10"></div> {/* Spacer for alignment */}
                </div>
            </header>

            <PageContainer className="pt-4 space-y-6">
                
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2">
                    <SummaryCard 
                        title="A Pagar" 
                        value={summary.pending + summary.overdue} 
                        icon={Wallet} 
                        color="text-slate-600"
                        active={activeFilter === 'pending' || activeFilter === 'overdue'}
                        onClick={() => handleFilterChange('pending')}
                    />
                     <SummaryCard 
                        title="Vencidas" 
                        value={summary.overdue} 
                        icon={CalendarClock} 
                        color="text-red-500"
                        active={activeFilter === 'overdue'}
                        onClick={() => handleFilterChange('overdue')}
                    />
                    <SummaryCard 
                        title="Pagas" 
                        value={summary.paid} 
                        icon={CheckCircle2} 
                        color="text-emerald-500"
                        active={activeFilter === 'paid'}
                        onClick={() => handleFilterChange('paid')}
                    />
                </div>

                {/* Filter Tabs (Visual) */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <FilterTab label="A Pagar" isActive={activeFilter === 'pending'} onClick={() => handleFilterChange('pending')} />
                    <FilterTab label="Vencidas" isActive={activeFilter === 'overdue'} onClick={() => handleFilterChange('overdue')} />
                    <FilterTab label="Pagas" isActive={activeFilter === 'paid'} onClick={() => handleFilterChange('paid')} />
                </div>

                {/* List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <p className="text-center text-slate-500 py-10">Calculando contas...</p>
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
                                    date: account.date, // SwipeableTransactionItem uses 'date' or 'transaction_date'? It uses processed props usually.
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

function SummaryCard({ title, value, icon: Icon, color, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "p-3 rounded-2xl flex flex-col items-start justify-between min-h-[90px] transition-all border",
                active 
                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm ring-1 ring-primary/20" 
                    : "bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50"
            )}
        >
            <div className={cn("p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700", color.replace('text-', 'bg-').replace('500', '100'))}>
                <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">{title}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(value)}</p>
            </div>
        </button>
    )
}

function FilterTab({ label, isActive, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                isActive 
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            {label}
        </button>
    )
}
