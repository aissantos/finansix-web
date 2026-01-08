import { memo } from 'react';
import { MoreHorizontal, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  onEdit?: () => void;
  onTransfer?: () => void;
}

export const AccountCard = memo(function AccountCard({
  account,
  onEdit,
  onTransfer,
}: AccountCardProps) {
  // Cor de fundo sutil baseada na cor da conta
  const iconColor = account.color || '#64748b';
  
  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-lg dark:hover:border-primary/20 dark:hover:shadow-primary/5">
      
      {/* Header: Ícone e Menu */}
      <div className="flex items-start justify-between">
        <div 
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm transition-transform group-hover:scale-110"
          style={{ backgroundColor: iconColor }}
        >
          {/* Iniciais ou Ícone */}
          <span className="font-bold text-lg">{account.name.substring(0, 2).toUpperCase()}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Editar Conta</DropdownMenuItem>
            <DropdownMenuItem onClick={onTransfer}>Nova Transferência</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body: Nome e Tipo */}
      <div className="mt-4">
        <h3 className="font-semibold text-foreground tracking-tight text-lg">{account.name}</h3>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-70">
            {account.type === 'checking' ? 'Corrente' : account.type === 'investment' ? 'Investimento' : 'Carteira'}
        </p>
      </div>

      {/* Footer: Saldo */}
      <div className="mt-6 flex items-end justify-between border-t border-border/40 pt-4">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground font-bold mb-0.5">Saldo Disponível</p>
          <p className={cn(
            "text-2xl font-bold tracking-tighter",
            (account.current_balance || 0) < 0 ? "text-red-500" : "text-foreground"
          )}>
            {formatCurrency(account.current_balance || 0)}
          </p>
        </div>
        
        {/* Quick Action (Opcional) */}
        <Button 
            variant="secondary" 
            size="icon" 
            className="h-9 w-9 rounded-full opacity-0 translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0"
            onClick={onTransfer}
            title="Transferência Rápida"
        >
            <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});