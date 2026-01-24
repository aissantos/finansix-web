import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import type { TransactionWithDetails } from "../../hooks/useGlobalTransactions";
import { CreditCard, Wallet, Tag, User, Home, Calendar, AlertCircle } from "lucide-react";

interface TransactionDetailModalProps {
  transaction: TransactionWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Detalhes da Transação</DialogTitle>
            <Badge variant={transaction.status === 'completed' ? 'default' : 'outline'}>
              {transaction.status}
            </Badge>
          </div>
          <DialogDescription>
            ID: {transaction.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Main Info */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
            <span className="text-sm text-muted-foreground mb-1">Valor da Transação</span>
            <div className={`text-4xl font-mono font-bold ${
              isIncome ? 'text-green-600' : isExpense ? 'text-red-600' : 'text-slate-600'
            }`}>
              {isIncome ? '+ ' : isExpense ? '- ' : ''}
              {formatCurrency(transaction.amount)}
            </div>
            <span className="text-sm text-muted-foreground mt-2">{transaction.description}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* User Info */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Usuário
              </h4>
              <div className="text-sm">
                <p className="font-medium">{transaction.users?.display_name || transaction.users?.email || 'N/A'}</p>
                <p className="text-muted-foreground text-xs">{transaction.users?.email}</p>
              </div>
            </div>

            {/* Household Info */}
             <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                Família (Household)
              </h4>
              <div className="text-sm">
                <p className="font-medium">{transaction.households?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Category Info */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Categoria
              </h4>
              <div className="text-sm">
                 <p className="font-medium">{transaction.categories?.name || 'Sem Categoria'}</p>
              </div>
            </div>

             {/* Date Info */}
             <div className="space-y-1">
              <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Data
              </h4>
              <div className="text-sm">
                 <p className="font-medium">{format(new Date(transaction.transaction_date), "dd 'de' MMMM 'de' yyyy")}</p>
                 <p className="text-muted-foreground text-xs">Criado em: {format(new Date(transaction.created_at || transaction.transaction_date), "dd/MM/yyyy HH:mm")}</p>
              </div>
            </div>
            
            {/* Payment Method (Mocked for now as we didn't join accounts/cards yet in the hook) */}
             <div className="space-y-1 col-span-2">
              <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                {transaction.credit_card_id ? <CreditCard className="h-4 w-4 text-muted-foreground" /> : <Wallet className="h-4 w-4 text-muted-foreground" />}
                Método de Pagamento
              </h4>
              <div className="text-sm">
                 <p className="font-medium">
                    {transaction.credit_card_id ? 'Cartão de Crédito' : transaction.account_id ? 'Conta Bancária/Carteira' : 'Outro'}
                 </p>
                 {transaction.is_installment && (
                   <Badge variant="secondary" className="mt-1">
                     Parcelado em {transaction.total_installments}x
                   </Badge>
                 )}
              </div>
            </div>
          </div>
          
           {transaction.notes && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex items-center gap-2 font-medium mb-1">
                <AlertCircle className="h-4 w-4" />
                Notas
              </div>
              <p className="text-muted-foreground">{transaction.notes}</p>
            </div>
          )}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {/* Future: Add 'Refund' or 'Delete' actions here for admins */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
