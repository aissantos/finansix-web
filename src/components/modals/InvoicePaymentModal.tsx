import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from '@/lib/utils';
import { CardInvoice } from '@/hooks/useAccountsPayable';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks';
import { toast } from '@/hooks/useToast';
import { format, addMonths } from 'date-fns';

interface InvoicePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: CardInvoice;
}

export function InvoicePaymentModal({ isOpen, onClose, invoice }: InvoicePaymentModalProps) {
    const [amount, setAmount] = useState<string>(invoice.totalAmount.toString());
    const [mode, setMode] = useState<'full' | 'partial'>('full');
    
    // Batch update existing transactions to 'completed'
    const updateTransaction = useUpdateTransaction();
    // Create new transaction for carry-over (partial payment)
    const createTransaction = useCreateTransaction();

    const handleConfirm = async () => {
        const payValue = parseFloat(amount.replace(',', '.')); // Simple parse, handle localization better in real app
        
        if (isNaN(payValue) || payValue <= 0) return;

        try {
            // 1. Mark all individual transactions in this invoice as PAID
            // Parallel execution for speed (or use a bulk update RPC if available, keeping it simple here)
            // Ideally backend should have a 'pay_invoice' RPC
            // For client-side simulation:
            const promises = invoice.transactions
                .filter(t => t.status === 'pending')
                .map(t => updateTransaction.mutateAsync({ id: t.id, status: 'completed' }));

            await Promise.all(promises);

            // 2. If Partial: Create a new debt for next month
            if (mode === 'partial' && payValue < invoice.totalAmount) {
                const remainder = invoice.totalAmount - payValue;
                const nextMonth = addMonths(new Date(invoice.dueDate), 1);
                
                await createTransaction.mutateAsync({
                    type: 'expense',
                    amount: remainder,
                    description: `Restante Fatura ${invoice.cardName} (${format(new Date(invoice.dueDate), 'MM/yyyy')})`,
                    credit_card_id: invoice.cardId,
                    transaction_date: format(nextMonth, 'yyyy-MM-dd'),
                    category_id: null, // 'Financeiro' or similar if available
                    is_installment: false,
                    total_installments: 1,
                    status: 'pending' // Starts as pending in next month
                });

                toast({
                    title: 'Pagamento Parcial Registrado',
                    description: `R$ ${formatCurrency(remainder)} transferido para o próximo mês.`,
                    variant: 'warning'
                });
            } else {
                toast({
                    title: 'Fatura Paga!',
                    description: 'Todas as transações foram baixadas.',
                    variant: 'success'
                });
            }

            onClose();
        } catch (error) {
            toast({
                title: 'Erro ao pagar',
                description: 'Tente novamente.',
                variant: 'destructive'
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Pagar Fatura {invoice.cardName}</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <Tabs defaultValue="full" onValueChange={(v) => {
                        setMode(v as any);
                        if (v === 'full') setAmount(invoice.totalAmount.toString());
                    }}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="full">Total</TabsTrigger>
                            <TabsTrigger value="partial">Parcial</TabsTrigger>
                        </TabsList>
                        
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
                            <p className="text-xs text-slate-500 mb-1">Valor Total da Fatura</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                {formatCurrency(invoice.totalAmount)}
                            </p>
                        </div>

                        <TabsContent value="partial" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Quanto você vai pagar?</Label>
                                <Input 
                                    type="number" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)}
                                    max={invoice.totalAmount}
                                />
                            </div>
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs">
                                O restante ({formatCurrency(invoice.totalAmount - (parseFloat(amount) || 0))}) será lançado como uma nova despesa na fatura do próximo mês.
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleConfirm} className="bg-emerald-500 hover:bg-emerald-600">
                        Confirmar Pagamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
