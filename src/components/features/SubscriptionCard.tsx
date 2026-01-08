import { memo } from 'react';
import { MoreHorizontal, CalendarClock, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Subscription } from '@/hooks/useSubscriptions';

interface SubscriptionCardProps {
  subscription: Subscription;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
}

export const SubscriptionCard = memo(function SubscriptionCard({
  subscription,
  onClick,
  onEdit,
  onDelete,
  onToggleActive,
}: SubscriptionCardProps) {
  
  // Lógica de Datas
  const today = new Date().getDate();
  const billingDay = subscription.billing_day;
  const daysUntil = billingDay >= today ? billingDay - today : 30 - today + billingDay;
  const isUpcoming = daysUntil <= 3 && subscription.is_active;
  const isToday = daysUntil === 0 && subscription.is_active;

  return (
    <div 
        className={cn(
            "group flex flex-col rounded-3xl border p-5 transition-all duration-300",
            // Estilos Ativo vs Inativo
            subscription.is_active 
                ? "bg-card border-border/50 hover:shadow-lg hover:border-primary/20 dark:hover:shadow-primary/5" 
                : "bg-muted/30 border-dashed border-border opacity-60 grayscale-[0.8]",
            // Borda de alerta se estiver vencendo
            isUpcoming && "border-amber-500/50 bg-amber-50/10"
        )}
    >
      <div className="flex items-start justify-between">
        {/* Ícone Container */}
        <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm transition-transform group-hover:scale-105",
            isUpcoming ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" : "bg-primary/10 text-primary"
        )}>
            {subscription.icon || '📦'}
        </div>

        {/* Menu Contextual */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Editar Detalhes</DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
                {subscription.is_active ? 'Pausar Assinatura' : 'Reativar Assinatura'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-500">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 flex-1">
        <h4 className="font-semibold text-foreground truncate">{subscription.name}</h4>
        <div className="flex items-center gap-2 mt-1">
            <h2 className="text-xl font-bold tracking-tight">
                {formatCurrency(subscription.amount)}
            </h2>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">/mês</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-4 border-t border-border/40">
        {/* Badge de Status */}
        <Badge variant="secondary" className={cn(
            "rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
            isToday ? "bg-red-100 text-red-600 dark:bg-red-900/30" :
            isUpcoming ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" :
            "bg-muted text-muted-foreground"
        )}>
            {isToday ? (
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Hoje</span>
            ) : (
                <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Dia {billingDay}</span>
            )}
        </Badge>
        
        {subscription.is_active && isUpcoming && (
            <span className="text-[10px] text-amber-600 font-bold animate-pulse">
                Vence logo
            </span>
        )}
      </div>
    </div>
  );
});