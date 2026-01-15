import { useMemo } from 'react';
import { isSameMonth, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { useTransactions } from './useTransactions';
import { useCreditCards } from './useCreditCards';
import { Transaction } from '@/types';

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'partial';

export interface CardInvoice {
  cardId: string;
  cardName: string;
  cardColor?: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string; // Calculated based on closing/due day
  status: InvoiceStatus;
  transactions: Transaction[];
}

export interface PayableAccount {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  category?: string;
  type: 'bill' | 'invoice'; // bill = conta avulsa, invoice = fatura cartão
  originalTransaction?: Transaction; // se for bill
  cardInvoice?: CardInvoice; // se for invoice
}

export function useAccountsPayable(selectedMonth: Date) {
  const { data: transactions, isLoading: txLoading } = useTransactions(selectedMonth);
  const { data: cards, isLoading: cardsLoading } = useCreditCards();

  const data = useMemo(() => {
    if (!transactions || !cards) return { invoices: [], bills: [], summary: { total: 0, paid: 0, pending: 0, overdue: 0 } };

    const invoicesMap = new Map<string, CardInvoice>();
    const bills: PayableAccount[] = [];

    // Initialize invoices for all active cards
    cards.forEach(card => {
        // Calculate due date for this month
        // Simple approximation: using current month + due_day
        // Perfect logic would handle month overflow if due_day < closing_day etc, but keeping simple for MVP
        const dueDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), card.due_day);
        
        invoicesMap.set(card.id, {
            cardId: card.id,
            cardName: card.name,
            cardColor: card.color,
            totalAmount: 0,
            paidAmount: 0,
            dueDate: dueDate.toISOString(),
            status: 'pending',
            transactions: []
        });
    });

    const today = startOfDay(new Date());

    transactions.forEach(tx => {
        if (tx.type !== 'expense') return;

        // Credit Card Expense
        if (tx.credit_card_id && invoicesMap.has(tx.credit_card_id)) {
            const invoice = invoicesMap.get(tx.credit_card_id)!;
            invoice.transactions.push(tx);
            invoice.totalAmount += tx.amount;
            if (tx.status === 'completed') {
                invoice.paidAmount += tx.amount;
            }
        } 
        // Direct Bill (Account Expense or null account)
        else if (!tx.credit_card_id) {
            const dueDate = parseISO(tx.transaction_date);
            let status: 'paid' | 'pending' | 'overdue' = 'pending';
            
            if (tx.status === 'completed') status = 'paid';
            else if (isBefore(dueDate, today)) status = 'overdue';

            bills.push({
                id: tx.id,
                description: tx.description,
                amount: tx.amount,
                date: tx.transaction_date,
                status,
                category: tx.category?.name,
                type: 'bill',
                originalTransaction: tx
            });
        }
    });

    // Process Invoices Final Status
    const invoices: PayableAccount[] = Array.from(invoicesMap.values())
        .filter(inv => inv.totalAmount > 0) // Only show cards with manual expenses or installments
        .map(inv => {
            let status: InvoiceStatus = 'pending';
            const dueDate = parseISO(inv.dueDate);
            
            if (inv.paidAmount >= inv.totalAmount - 0.01) { // Tolerance for floats
                status = 'paid';
            } else if (inv.paidAmount > 0) {
                status = 'partial';
            } else if (isBefore(dueDate, today)) {
                status = 'overdue';
            }

            return {
                id: `invoice-${inv.cardId}`,
                description: `Fatura ${inv.cardName}`,
                amount: inv.totalAmount,
                date: inv.dueDate,
                status: status === 'partial' ? 'pending' : status, // Map partial to pending for filtering simplicity or handle explicitly
                type: 'invoice',
                cardInvoice: inv
            };
        });

    // Unified List
    const allAccounts = [...invoices, ...bills];

    // Summary calculation
    const summary = allAccounts.reduce((acc, item) => {
        acc.total += item.amount;
        if (item.status === 'paid') acc.paid += item.amount;
        else {
            acc.pending += item.amount;
            if (item.status === 'overdue') acc.overdue += item.amount;
        }
        return acc;
    }, { total: 0, paid: 0, pending: 0, overdue: 0 });

    return { 
        invoices, 
        bills, 
        allAccounts, 
        summary 
    };

  }, [transactions, cards, selectedMonth]);

  return {
    ...data,
    isLoading: txLoading || cardsLoading
  };
}
